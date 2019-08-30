import mysql.connector #pip install mysql-connector-python
from contextlib import closing
from mysql.connector.errors import OperationalError
class DBConn:	
	def getDBConnection(self):
		try:
			#if self._db is None:
			#	self._openDBConnection(server=self.server, user=self.user, password=self.password, dbName=self.dbName)
			cnx = mysql.connector.connect(pool_name="hm_uuid_db")
			with closing(cnx.cursor()) as curs:
				curs = cnx.cursor()
				curs.execute("SELECT VERSION()")
				results = curs.fetchone()
			if not results:
				raise Exception("Database connection test failed")
		except OperationalError:
			try:
				if not self._openDBConnection(server=self.server, user=self.user, password=self.password, dbName=self.dbName):
					raise Exception("Database reconnection test failed")
				cnx = mysql.connector.connect(pool_name="hm_uuid_db")
			except Exception as e:
				raise e
		#return self._db
		return cnx

	def _openDBConnection(self, server, user, password, dbName):
		self._db = None
		try:
			#if self._dbpool is None:
			#dbargs = {
			#	"host": server,
			#	"user": user,
			#	"password": password,
			#	"database": dbName
			#}
			#self._dbpool = mysql.connector.pooling.MySQLConnectionPool(pool_name = "hm-mysql-pool", pool_size = 10, **dbargs)
			
			cnx =  mysql.connector.connect(pool_name ="hm_uuid_db", pool_size = 8, host=server, user=user, password=password, database=dbName)

			with closing(cnx.cursor()) as curs:
				curs = cnx.cursor()
				curs.execute("SELECT VERSION()")
				results = curs.fetchone()
			# Check if anything at all is returned
			cnx.close()
			if results:
				return True
			else:
				return False               
		except Exception as e:
			raise e
			
		return False

	def __init__(self, dbHost, username, password, dbName):
		try:
			#dbConnected = self._openDBConnection(dbHost, username, password, dbName)
			self._openDBConnection(dbHost, username, password, dbName)
			self.server = dbHost
			self.user = username
			self.password = password
			self.dbName = dbName			
		except Exception as e:
			raise Exception("Error opening database connection for " + username + "@" + dbHost + " on "  + username + "@" + dbName + "\n" + str(e))
		#if not dbConnected:
		#	raise Exception("Error connecting to " + dbName + " at " + username + "@" + dbHost)
			
	def __del__(self):
		if not self._db is None:
			self._db.close()
	
