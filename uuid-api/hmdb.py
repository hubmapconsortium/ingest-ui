import mysql.connector #pip install mysql-connector-python

class DBConn:
	
	def openDBConnection(self, server, user, password, dbName):
		self.db = None
		try:
			self.db =  mysql.connector.connect(host=server, user=user, password=password, database=dbName)
			cursor = self.db.cursor()
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
			dbConnected = self.openDBConnection(dbHost, username, password, dbName)
		except Exception as e:
			raise Exception("Error opening database connection for " + username + "@" + dbHost + " on "  + username + "@" + dbName + "\n" + str(e))
		if not dbConnected:
			raise Exception("Error connecting to " + dbName + " at " + username + "@" + dbHost)
			
	def __del__(self):
		if not self.db is None:
			self.db.close()
	
