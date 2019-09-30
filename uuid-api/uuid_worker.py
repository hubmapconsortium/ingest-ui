import sys
import os
import logging
from flask import Response
import threading
import secrets
import time
from contextlib import closing
import json
from properties.p import Property #pip install property 
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
import string_helper
from hm_auth import AuthHelper
from hmdb import DBConn

MAX_GEN_IDS = 100
INSERT_SQL = "INSERT INTO hm_uuids (HMUUID, DOI_SUFFIX, ENTITY_TYPE, PARENT_UUID, TIME_GENERATED, USER_ID, USER_EMAIL, HUBMAP_ID) VALUES (%s, %s, %s, %s, %s, %s,%s, %s)"

PROP_FILE_NAME = os.path.join(os.path.dirname(__file__), 'uuid.properties') 
DOI_ALPHA_CHARS=['B','C','D','F','G','H','J','K','L','M','N','P','Q','R','S','T','V','W','X','Z']                 
DOI_NUM_CHARS=['2','3','4','5','6','7','8','9']                                                                                   
HEX_CHARS=['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']
UUID_SELECTS = "HMUUID as hmuuid, DOI_SUFFIX as doiSuffix, ENTITY_TYPE as type, PARENT_UUID as parentId, TIME_GENERATED as timeStamp, USER_ID as userId, HUBMAP_ID as hubmapId, USER_EMAIL as email"

def isValidHMId(hmid):
	if string_helper.isBlank(hmid): return False
	tidl = hmid.strip().lower()	
	if tidl.startswith('test') or tidl.startswith('van') or tidl.startswith('ufl') or tidl.startswith('stan') or tidl.startswith('ucsd') or tidl.startswith('calt'):
		return True	
	tid = stripHMid(hmid)
	l = len(tid)
	if not (l == 10 or l == 32): return False
	tid = tid.upper()
	if l == 10:
		if not set(tid[0:3]).issubset(DOI_NUM_CHARS): return False
		if not set(tid[3:7]).issubset(DOI_ALPHA_CHARS): return False
		if not set(tid[7:]).issubset(DOI_NUM_CHARS): return False
	if l == 32:
		if not set(tid).issubset(HEX_CHARS): return False
	return True

def stripHMid(hmid):
	if string_helper.isBlank(hmid): return hmid
	thmid = hmid.strip();
	if thmid.lower().startswith('hbm'): thmid = thmid[3:]
	if thmid.startswith(':'): thmid = thmid[1:]
	return 	thmid.strip().replace('-', '').replace('.', '').replace(' ', '')


class UUIDWorker:

	authHelper = None
	
	def __init__(self, clientId, clientSecret):
		if clientId is None or clientSecret is None or string_helper.isBlank(clientId) or string_helper.isBlank(clientSecret):
			raise Exception("Globus client id and secret are required in AuthHelper")
		
		if not os.path.isfile(PROP_FILE_NAME):																						  
			raise Exception("Property file " + PROP_FILE_NAME + " is required and was not found.")											   

		if not AuthHelper.isInitialized():
			self.authHelper = AuthHelper.create(clientId=clientId, clientSecret=clientSecret)
		else:
			self.authHelper.instance()
			
		#Open the config file	
		self.logger = logging.getLogger('uuid.service')                                                                                             																									 
		propMgr = Property()																										  
		self.props = propMgr.load_property_files(PROP_FILE_NAME)
		self.dbName = self.getProperty("db.name")
		self.dbUsername = self.getProperty("db.username")
		self.dbPassword = self.getProperty("db.password")
		self.dbHost = self.getProperty("db.host")
		self.lock = threading.RLock()
		self.hmdb = DBConn(self.dbHost, self.dbUsername, self.dbPassword, self.dbName)

	def uuidPost(self, req, nIds):
		userInfo = self.authHelper.getUserInfoUsingRequest(req)
		hasHubmapIds = False
		hmids = None
		if isinstance(userInfo, Response):
			return userInfo;

		if not req.is_json:
			return(Response("Invalid input, json required.", 400))
		content = req.get_json()
		if content is None or len(content) <= 0:
			return(Response("Invalid input, uuid attributes required", 400))
		if not 'entityType' in content or string_helper.isBlank(content['entityType']):
			return(Response("entityType is a required attribute", 400))
		
		if 'hubmap-ids' in content:
			hmids = content['hubmap-ids']
			if not (hmids is not None and isinstance(hmids, list) and len(hmids) > 0):			
				hmids = None
			
		#if hasHubmapIds and not len(hmids) == nIds:
		#	return(Response("Invalid input: Length of HuBMAP ID list must match the number of ids being generated"))
		
		entityType = content['entityType'].upper().strip()
		parentId = None
		if('parentId' in content and not string_helper.isBlank(content['parentId'])):
			parentId = content['parentId'].strip()

		if(entityType == 'TISSUE' and parentId is None):
			return(Response("parentId is a required attribute for TISSUE entities", 400))
		
		generateDOI = False
		if('generateDOI' in content and string_helper.isYes(content['generateDOI'])):
			generateDOI = True

		if not parentId is None and not self.uuidExists(parentId):
			return(Response("Parent id " + parentId + " does not exist"), 400)

		if not 'sub' in userInfo:
			return Response("Unable to get user id (sub) via introspection", 400)

		userId = userInfo['sub']
		userEmail = None
		if 'email' in userInfo:
			userEmail = userInfo['email']
		
		#rVal = []
		#for x in range(nIds):
		#	if hasHubmapIds:
		#		rVal.append(self.newUUID(generateDOI, parentId, entityType, userId, userEmail, hmids[x]))
		#	else:
		#		rVal.append(self.newUUID(generateDOI, parentId, entityType, userId, userEmail))
		#return rVal
		return self.newUUIDs(generateDOI, parentId, entityType, userId, userEmail, nIds, hmids)

	def newUUIDTest(self, generateDOI, parentId, entityType, userId, userEmail):
		return self.newUUID(generateDOI, parentId, entityType, userId, userEmail)

	def uuidGen(self):
		hexVal = ""
		for x in range(32):                                                                                                                
			hexVal = hexVal + secrets.choice(HEX_CHARS)
		hexVal = hexVal.lower()
		return hexVal
	
	#generate multiple ids, one for each display id in the displayIds array
	def newUUIDs(self, generateDOI, parentID, entityType, userId, userEmail, nIds, displayIds=None):
		hasDisplayIds = False
		if displayIds is not None and len(displayIds) > 0:
			hasDisplayIds = True
			if len(displayIds) != nIds:
				raise Exception("Number of display ids to store " + str(len(displayIds)) + " does not match the number of ids being generated (" + str(nIds) + ")")
			dupes = self.__findDupsInDB("HUBMAP_ID", displayIds)
			if(dupes is not None and len(dupes) > 0):
				raise Exception("Display ID(s) are not unique " + string_helper.listToCommaSeparated(dupes))
			
			
		returnIds = []
		insertVals = []
		now = time.strftime('%Y-%m-%d %H:%M:%S')
		with self.lock:        
			#generate in batches
			displayIdCount = 0
			for i in range(0, nIds, MAX_GEN_IDS):
				numToGen = min(MAX_GEN_IDS, nIds - i)
				#generate uuids
				uuids = self.__nUniqueIds(numToGen, self.uuidGen, "HMUUID")
				if generateDOI:
					dois = self.__nUniqueIds(numToGen, self.newDoi, "DOI_SUFFIX")
				
				for n in range(0, numToGen):
					insUuid = uuids[n]
					thisId = {"uuid":insUuid}
					if generateDOI:
						insDoi = dois[n]
						insDispDoi = self.__displayDoi(insDoi)
						thisId["doi"] = insDoi
						thisId["displayDoi"] = insDispDoi
					else:
						insDoi = None
						
					if hasDisplayIds:
						insDisplayId = displayIds[displayIdCount]
						thisId['hubmapId'] = insDisplayId
						displayIdCount = displayIdCount + 1
					else:
						insDisplayId = None
						
					returnIds.append(thisId)
					insRow = (insUuid, insDoi, entityType, parentID, now, userId, userEmail, insDisplayId)
					insertVals.append(insRow)
		
			with closing(self.hmdb.getDBConnection()) as dbConn:
				with closing(dbConn.cursor()) as curs:
					curs.executemany(INSERT_SQL, insertVals)
				dbConn.commit()
			
		return json.dumps(returnIds)

	def nUniqueIds(self, nIds, idGenMethod, dbColumn):
		return self.__nUniqueIds(nIds, idGenMethod, dbColumn)
		
	#generate unique ids
	#generates ids with provided id generation method and checks them against existing ids in the DB
	#this method MUST BE CALLED FROM WITHIN a self.lock block
	def __nUniqueIds(self, nIds, idGenMethod, dbColumn, previousGeneratedIds=set(), iteration=1):
		ids = set()
		for n in range(nIds):			
			newId = idGenMethod()
			count = 1
			while (newId in ids or newId in previousGeneratedIds) and count < 100:
				newId = idGenMethod()
				count = count + 1
			if count == 100:
				raise Exception("Unable to generate an initial unique id for " + dbColumn + " after 100 attempts.")
			ids.add(newId)
		dupes = self.__findDupsInDB(dbColumn, ids)
		if dupes is not None and len(dupes) > 0:
			iter = iteration + 1
			if iter > 100:
				raise Exception("Unable to generate unique id(s) for " + dbColumn + " after 100 attempts.")
			replacements = self.__nUniqueIds(len(dupes), idGenMethod, dbColumn, previousGeneratedIds=ids, iteration=iter)
			for val in dupes:
				ids.remove(val[0])
			for val in replacements:
				ids.add(val)
		return list(ids)
	
	def __findDupsInDB(self, dbColumn, idSet):
		sql = "select " + dbColumn + " from hm_uuids where " + dbColumn + " IN(" + string_helper.listToCommaSeparated(idSet, "'") + ")"
		with closing(self.hmdb.getDBConnection()) as dbConn:
			with closing(dbConn.cursor()) as curs:
				curs.execute(sql)
				dupes = curs.fetchall()
		
		return dupes

	
	def newUUID(self, generateDOI, parentID, entityType, userId, userEmail, hubmapId=None):
		doi = None
		hmid = self.uuidGen() #uuid.uuid4().hex
		if generateDOI:
			doi = self.newDoi()

		with self.lock:
			count = 0
			while(self.uuidExists(hmid) and count < 100):
				hmid = self.uuidGen() #uuid.uuid4().hex
				count = count + 1
			if count == 100:
				raise Exception("Unable to generate a unique uuid after 100 attempts")
			if generateDOI:
				count = 0;
				while(self.doiExists(doi) and count < 100):
					doi = self.newDoi()
					count = count + 1
			if count == 100:
				raise Exception("Unable to generate a unique doi id after 100 attempts")					
			now = time.strftime('%Y-%m-%d %H:%M:%S')
			sql = "INSERT INTO hm_uuids (HMUUID, DOI_SUFFIX, ENTITY_TYPE, PARENT_UUID, TIME_GENERATED, USER_ID, USER_EMAIL, HUBMAP_ID) VALUES (%s, %s, %s, %s, %s, %s,%s, %s)"
			vals = (hmid, doi, entityType, parentID, now, userId, userEmail, hubmapId)
			with closing(self.hmdb.getDBConnection()) as dbConn:
				with closing(dbConn.cursor()) as curs:
					curs.execute(sql, vals)
				dbConn.commit()

		if generateDOI:
			dispDoi = self.__displayDoi(doi)
			if hubmapId is None:
				rVal = {
					"displayDoi": dispDoi,
					"doi": doi,
					"uuid": hmid
					}
			else:
				rVal = {
					"displayDoi": dispDoi,
					"doi": doi,
					"uuid": hmid,
					"hubmapId": hubmapId
					}				
			#return jsonify(uuid=hmid, doi=doi, displayDoi=dispDoi)
		else:
			if hubmapId is None:
				rVal = {
					"uuid":hmid
					}
			else:
				rVal = {
					"uuid":hmid,
					"hubampId": hubmapId
					}				
			#return jsonify(uuid=hmid)
		return rVal
	
	def __displayDoi(self, doiSuffix):
		dispDoi= 'HBM' + doiSuffix[0:3] + '.' + doiSuffix[3:7] + '.' + doiSuffix[7:]
		return dispDoi

	def newDoi(self):
		nums1 = ''                                                                                                                        
		nums2 = ''                                                                                                                        
		alphs = ''                                                                                                                        
		for x in range(3):                                                                                                                
			nums1 = nums1 + secrets.choice(DOI_NUM_CHARS) #[random.randint(0,len(DOI_NUM_CHARS)-1)]                                                           
		for x in range(3):                                                                                                                
			nums2 = nums2 + secrets.choice(DOI_NUM_CHARS) #[random.randint(0,len(DOI_NUM_CHARS)-1)]                                                           
		for x in range(4):                                                                                                                
			alphs = alphs + secrets.choice(DOI_ALPHA_CHARS) #[random.randint(0,len(DOI_ALPHA_CHARS)-1)]                                                       

		val = nums1 + alphs + nums2   
		return(val)
	
	def getIdExists(self, hmid):
			if not isValidHMId(hmid):
				return Response("Invalid HuBMAP Id", 400)
			tid = stripHMid(hmid)
			tidl = hmid.strip().lower()
			if tidl.startswith('test') or tidl.startswith('van') or tidl.startswith('ufl') or tidl.startswith('stan') or tidl.startswith('ucsd') or tidl.startswith('calt'):
				return self.hmidExists(hmid.strip())			
			elif len(tid) == 10:
				return self.doiExists(tid.upper())
			elif len(tid) == 32:
				return self.uuidExists(tid.lower())
			else:
				return Response("Invalid HuBMAP Id (or empty or bad length)", 400)	

	
	def getIdInfo(self, hmid):
		if not isValidHMId(hmid):
			return Response("Invalid HuBMAP Id", 400)
		tidl = hmid.strip().lower()
		tid = stripHMid(hmid)
		if tidl.startswith('test') or tidl.startswith('van') or tidl.startswith('ufl') or tidl.startswith('stan') or tidl.startswith('ucsd') or tidl.startswith('calt'):
			sql = "select " + UUID_SELECTS + " from hm_uuids where lower(hubmap_id) ='" + tidl + "'"
		elif len(tid) == 10:
			sql = "select " + UUID_SELECTS + " from hm_uuids where doi_suffix ='" + tid + "'"
		elif len(tid) == 32:
			sql = "select " + UUID_SELECTS + " from hm_uuids where hmuuid ='" + tid + "'"
		else:
			return Response("Invalid HuBMAP Id (empty or bad length)", 400)
		with closing(self.hmdb.getDBConnection()) as dbConn:
			with closing(dbConn.cursor()) as curs:
				curs.execute(sql)
				results = [dict((curs.description[i][0], value) for i, value in enumerate(row)) for row in curs.fetchall()]

		return json.dumps(results, indent=4, sort_keys=True, default=str)

	def uuidExists(self, hmid):
		with closing(self.hmdb.getDBConnection()) as dbConn:
			with closing(dbConn.cursor()) as curs:
				curs.execute("select count(*) from hm_uuids where hmuuid = '" + hmid + "'")
				res = curs.fetchone()

		if(res is None or len(res) == 0): return False
		if(res[0] == 1): return True
		if(res[0] == 0): return False
		raise Exception("Multiple uuids found matching " + hmid)
	
	def doiExists(self, doi):
		with closing(self.hmdb.getDBConnection()) as dbConn:
			with closing(dbConn.cursor()) as curs:
				curs.execute("select count(*) from hm_uuids where doi_suffix = '" + doi + "'")
				res = curs.fetchone()
		if(res is None or len(res) == 0): return False
		if(res[0] == 1): return True
		if(res[0] == 0): return False
		raise Exception("Multiple dois found matching " + doi)
		
	def hmidExists(self, hmid):
		with closing(self.hmdb.getDBConnection()) as dbConn:
			with closing(dbConn.cursor()) as curs:
				curs.execute("select count(*) from hm_uuids where hubmap_id = '" + hmid + "'")
				res = curs.fetchone()
		if(res is None or len(res) == 0): return False
		if(res[0] == 1): return True
		if(res[0] == 0): return False
		raise Exception("Multiple HuBMAP IDs found matching " + hmid)
		
	def getProperty(self, propName):																		 
		if not propName in self.props:																								
			raise Exception('Required property ' + propName + ' not found')																												   
		else:																													 
			val = self.props[propName]																								
			if string_helper.isBlank(val):																						
				raise Exception('Required property ' + propName + ' is blank')																												
			else:																												 
				return val.strip()																								
