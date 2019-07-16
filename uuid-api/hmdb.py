import mysql.connector #pip install mysql-connector-python
from mysql.connector.errors import OperationalError
class DBConn:	
	def getDB(self):
		try:
			if self._db is None:
				self._openDBConnection(server=self.server, user=self.user, password=self.password, dbName=self.dbName)
			cursor = self._db.cursor()
			cursor.execute("SELECT VERSION()")
			results = cursor.fetchone()
			if not results:
				raise Exception("Database connection test failed")
				
		except OperationalError:
			try:
				if not self._openDBConnection(server=self.server, user=self.user, password=self.password, dbName=self.dbName):
					raise Exception("Database reconnection test failed")
			except Exception as e:
				raise e
		return self._db

	def _openDBConnection(self, server, user, password, dbName):
		self._db = None
		try:
			self._db =  mysql.connector.connect(host=server, user=user, password=password, database=dbName)
			cursor = self._db.cursor()
			cursor.execute("SELECT VERSION()")
			results = cursor.fetchone()
			# Check if anything at all is returned
			if results:
				return True
			else:
				return False               
		except Exception as e:
			raise e
			
		return False

	def __init__(self, dbHost, username, password, dbName):
		try:
			dbConnected = self._openDBConnection(dbHost, username, password, dbName)
			self.server = dbHost
			self.user = username
			self.password = password
			self.dbName = dbName			
		except Exception as e:
			raise Exception("Error opening database connection for " + username + "@" + dbHost + " on "  + username + "@" + dbName + "\n" + str(e))
		if not dbConnected:
			raise Exception("Error connecting to " + dbName + " at " + username + "@" + dbHost)
			
	def __del__(self):
		if not self._db is None:
			self._db.close()
	
