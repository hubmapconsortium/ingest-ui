'''
Created on Apr 18, 2019

@author: chb69
'''
from neo4j import TransactionError, CypherError
import os
import sys
from hubmap_const import HubmapConst 
from neo4j_connection import Neo4jConnection
from uuid_generator import getNewUUID
import configparser
from hm_auth import AuthCache, AuthHelper
import pprint
from flask import Response
from autherror import AuthError

class Entity(object):
    '''
    classdocs
    '''
    
    entity_config = {}

    def __init__(self):
        self.load_config_file()

    def load_config_file(self):
        config = configparser.ConfigParser()
        try:
            config.read(os.path.join(os.path.dirname(__file__), '..', 'common-api', 'app.properties'))
            self.entity_config['APP_CLIENT_ID'] = config.get('GLOBUS', 'APP_CLIENT_ID')
            self.entity_config['APP_CLIENT_SECRET'] = config.get(
                'GLOBUS', 'APP_CLIENT_SECRET')
            self.entity_config['STAGING_ENDPOINT_UUID'] = config.get(
                'GLOBUS', 'STAGING_ENDPOINT_UUID')
            self.entity_config['PUBLISH_ENDPOINT_UUID'] = config.get(
                'GLOBUS', 'PUBLISH_ENDPOINT_UUID')
            self.entity_config['SECRET_KEY'] = config.get('GLOBUS', 'SECRET_KEY')
            self.entity_config['UUID_UI_URL'] = config.get('HUBMAP', 'UUID_UI_URL')
            #app.config['DEBUG'] = True
        except OSError as err:
            msg = "OS error.  Check config.ini file to make sure it exists and is readable: {0}".format(
                err)
            print(msg + "  Program stopped.")
            exit(0)
        except configparser.NoSectionError as noSectError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
                noSectError)
            print(msg + "  Program stopped.")
            exit(0)
        except configparser.NoOptionError as noOptError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
                noOptError)
            print(msg + "  Program stopped.")
            exit(0)
        except SyntaxError as syntaxError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
                syntaxError)
            msg = msg + "  Cannot read line: {0}".format(syntaxError.text)
            print(msg + "  Program stopped.")
            exit(0)
        except AttributeError as attrError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
                attrError)
            msg = msg + "  Cannot read line: {0}".format(attrError.text)
            print(msg + "  Program stopped.")
            exit(0)
        except:
            msg = "Unexpected error:", sys.exc_info()[0]
            print(msg + "  Program stopped.")
            exit(0)

    @staticmethod
    # NOTE: This will return a single entity, activity, or agent
    def get_entity(driver, identifier): 
        with driver.session() as session:
            return_list = []
            try:
                #TODO: I can use the OR operator to match on either uuid or doi:
                #MATCH (e) WHERE e.label= 'test dataset create file10' OR e.label= 'test dataset create file7' RETURN e
                stmt = "MATCH (a) WHERE a.{uuid_attrib}= $identifier RETURN properties(a) as properties".format(uuid_attrib=HubmapConst.UUID_ATTRIBUTE)

                for record in session.run(stmt, identifier=identifier):
                    dataset_record = record['properties']
                    return_list.append(dataset_record)
                if len(return_list) == 0:
                    raise LookupError('Unable to find entity using identifier:' + identifier)
                if len(return_list) > 1:
                    raise LookupError('Error more than one entity found with identifier:' + identifier)
                return return_list[0]                    
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

    @staticmethod
    # NOTE: This will return a list of all entities matching a type
    def get_entity_by_type(driver, type_string): 
        with driver.session() as session:
            return_list = []
            try:
                #TODO: I can use the OR operator to match on either uuid or doi:
                #MATCH (e) WHERE e.label= 'test dataset create file10' OR e.label= 'test dataset create file7' RETURN e
                stmt = "MATCH (a) WHERE a.{type_attrib}= $type_string RETURN properties(a) as properties".format(type_attrib=HubmapConst.TYPE_ATTRIBUTE)

                for record in session.run(stmt, type_string=type_string):
                    dataset_record = record['properties']
                    return_list.append(dataset_record)
                return return_list                   
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

    @staticmethod
    # NOTE: This will return a list of all entities matching a type
    def get_entity_type_list(driver): 
        with driver.session() as session:
            return_list = []
            try:
                #TODO: I can use the OR operator to match on either uuid or doi:
                #MATCH (e) WHERE e.label= 'test dataset create file10' OR e.label= 'test dataset create file7' RETURN e
                stmt = "MATCH (e:Entity) RETURN DISTINCT e.{type_attrib} AS type_name".format(type_attrib=HubmapConst.ENTITY_TYPE_ATTRIBUTE)

                for record in session.run(stmt):
                    dataset_record = record['type_name']
                    return_list.append(dataset_record)
                return return_list                   
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

    @staticmethod
    def does_identifier_exist(driver, identifier):
        try:
            entity = Entity.get_entity(driver, identifier)
            return True
        except:
            return False

    # Note: when editing an entity, you are really editing the metadata attached to the entity
    def edit_entity(self, driver, token, entityuuid, entityjson): 
        tx = None
        try:
            if Entity.does_identifier_exist(driver, entityuuid) == False:
                raise ValueError("Cannot find entity with uuid: " + entityuuid)
            metadata_list = Entity.get_entities_by_relationship(driver, entityuuid, HubmapConst.HAS_METADATA_REL)
            if len(metadata_list) > 1:
                raise ValueError("Found more than one metadata entry attached to uuid: " + entityuuid)
            metadata_entity = metadata_list[0]
            authcache = None
            if AuthHelper.isInitialized() == False:
                authcache = AuthHelper.create(
                    self.entity_config['APP_CLIENT_ID'], self.entity_config['APP_CLIENT_SECRET'])
            else:
                authcache = AuthHelper.instance()
            userinfo = authcache.getUserInfo(token, True)
            #replace the uuid with the metadata uuid
            entityjson[HubmapConst.UUID_ATTRIBUTE] = metadata_entity[HubmapConst.UUID_ATTRIBUTE]
            stmt = Neo4jConnection.get_update_statement(entityjson, True)
            with driver.session() as session:
                tx = session.begin_transaction()
                tx.run(stmt)
                tx.commit()
                return metadata_entity[HubmapConst.UUID_ATTRIBUTE]
        except TransactionError as te: 
            print ('A transaction error occurred: ', te.value)
            if tx.closed() == False:
                tx.rollback()
            raise te
        except CypherError as cse:
            print ('A Cypher error was encountered: ', cse.message)
            if tx.closed() == False:
                tx.rollback()
            raise cse               
        except:
            print ('A general error occurred: ')
            for x in sys.exc_info():
                print (x)
            if tx.closed() == False:
                tx.rollback()
            raise
        
    
    def can_user_edit_entity(self, driver, token, entityuuid): 
        try:
            if Entity.does_identifier_exist(driver, entityuuid) == False:
                raise ValueError("Cannot find entity with uuid: " + entityuuid)
            metadata_list = Entity.get_entities_by_relationship(driver, entityuuid, HubmapConst.HAS_METADATA_REL)
            if len(metadata_list) > 1:
                raise ValueError("Found more than one metadata entry attached to uuid: " + entityuuid)
            metadata_entity = metadata_list[0]
            authcache = None
            if AuthHelper.isInitialized() == False:
                authcache = AuthHelper.create(
                    self.entity_config['APP_CLIENT_ID'], self.entity_config['APP_CLIENT_SECRET'])
            else:
                authcache = AuthHelper.instance()
            userinfo = authcache.getUserInfo(token, True)
            if 'hmgroupids' not in userinfo:
                raise ValueError("Cannot find Hubmap Group information for token")
            if HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE not in metadata_entity:
                raise ValueError("Cannot find Hubmap Group information in metadata entity associated with uuid: " + entityuuid)
                
            hmgroups = userinfo['hmgroupids']
            for g in hmgroups:
                if str(g).lower() == str(metadata_entity[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE]).lower():
                    return True
            return False
        except BaseException as be:
            pprint(be)
            raise be

    def get_user_groups(self, token):
        try:
            authcache = None
            if AuthHelper.isInitialized() == False:
                authcache = AuthHelper.create(
                    self.entity_config['APP_CLIENT_ID'], self.entity_config['APP_CLIENT_SECRET'])
            else:
                authcache = AuthHelper.instance()
            userinfo = authcache.getUserInfo(token, True)

            if type(userinfo) == Response and userinfo.status_code == 401:
                raise AuthError('token is invalid.', 401)

            if 'hmgroupids' not in userinfo:
                raise ValueError("Cannot find Hubmap Group information for token")
            return_list = []
            group_list = AuthCache.getHMGroups()
            for group_uuid in userinfo['hmgroupids']:
                for group_name in group_list.keys():
                    if group_list[group_name]['uuid'] == group_uuid:
                        return_list.append(group_list[group_name])
                        break
            return return_list
        except:
            print ('A general error occurred: ')
            for x in sys.exc_info():
                print (x)
            raise

    def get_user_roles(self, token):
        try:
            authcache = None
            if AuthHelper.isInitialized() == False:
                authcache = AuthHelper.create(
                    self.entity_config['APP_CLIENT_ID'], self.entity_config['APP_CLIENT_SECRET'])
            else:
                authcache = AuthHelper.instance()
            userinfo = authcache.getUserInfo(token, True)

            if type(userinfo) == Response and userinfo.status_code == 401:
                raise AuthError('token is invalid.', 401)

            if 'hmgroupids' not in userinfo:
                raise ValueError("Cannot find Hubmap Group information for token")
            return_list = []
            role_list = AuthCache.getHMRoles()
            for role_uuid in userinfo['hmroleids']:
                for role_name in role_list.keys():
                    if role_list[role_name]['uuid'] == role_uuid:
                        return_list.append(role_list[role_name])
                        break
            return return_list
        except:
            print ('A general error occurred: ')
            for x in sys.exc_info():
                print (x)
            raise
    
    def get_readonly_user_groups(self, token):
        return self.get_user_groups_generic(token, 'READONLY')

    def get_writeable_user_groups(self, token):
        return self.get_user_groups_generic(token, 'WRITEABLE')

    def get_user_groups_generic(self, token, group_type):
        try:
            authcache = None
            if AuthHelper.isInitialized() == False:
                authcache = AuthHelper.create(
                    self.entity_config['APP_CLIENT_ID'], self.entity_config['APP_CLIENT_SECRET'])
            else:
                authcache = AuthHelper.instance()
            userinfo = authcache.getUserInfo(token, True)

            if type(userinfo) == Response and userinfo.status_code == 401:
                raise AuthError('token is invalid.', 401)

            if 'hmgroupids' not in userinfo:
                raise ValueError("Cannot find Hubmap Group information for token")
            return_list = []
            bWriteable = False
            if group_type == 'WRITEABLE':
                bWriteable = True
            
            
            group_list = AuthCache.getHMGroups()
            for group_uuid in userinfo['hmgroupids']:
                for group_name in group_list.keys():
                    if group_list[group_name]['uuid'] == group_uuid:
                        if group_list[group_name]['generateuuid'] == bWriteable:
                            return_list.append(group_list[group_name])
                        break
            return return_list
        except:
            print ('A general error occurred: ')
            for x in sys.exc_info():
                print (x)
            raise
       
    def get_editable_entities_by_type(self, driver, token, type_code=None): 
        with driver.session() as session:
            return_list = []

            try:
                #if type_code != None:
                #    general_type = HubmapConst.get_general_node_type_attribute(type_code)
                group_list = []            
                hmgroups = self.get_user_groups(token)
                for g in hmgroups:
                    group_record = self.get_group_by_identifier(g['name'])
                    group_list.append(group_record['uuid'])
                matching_stmt = ""
                if type_code != None:
                    if str(type_code).lower() == 'donor':
                        # ensure proper case
                        type_code = 'Donor'
                        type_attrib = HubmapConst.ENTITY_TYPE_ATTRIBUTE
                        matching_stmt = "MATCH (a {{{type_attrib}: '{type_code}'}})-[:{rel_code}]->(m)".format(
                            type_attrib=type_attrib, type_code=type_code, 
                            rel_code=HubmapConst.HAS_METADATA_REL)
                    else:
                        type_attrib = HubmapConst.SPECIMEN_TYPE_ATTRIBUTE                        
                        matching_stmt = "MATCH (a)-[:{rel_code}]->(m {{ {type_attrib}: '{type_code}' }})".format(
                            type_attrib=type_attrib, type_code=type_code, rel_code=HubmapConst.HAS_METADATA_REL)
                        
                else:
                    matching_stmt = "MATCH (a)-[:{rel_code}]->(m)".format(
                        rel_code=HubmapConst.HAS_METADATA_REL)
                    
                stmt = matching_stmt + " WHERE a.{entitytype_attr} IS NOT NULL RETURN a.{uuid_attr} AS entity_uuid, a.{hubmapid_attr} AS hubmap_identifier, a.{entitytype_attr} AS datatype, a.{doi_attr} AS entity_doi, a.{display_doi_attr} as entity_display_doi, properties(m) AS metadata_properties ORDER BY m.{provenance_timestamp} DESC".format(
                    uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,
                    activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                    display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE, provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE)

                print("Here is the query: " + stmt)
                readonly_group_list = self.get_readonly_user_groups(token)
                writeable_group_list = self.get_writeable_user_groups(token)
                readonly_uuid_list = []
                writeable_uuid_list = []
                #build UUID group list
                for readonly_group_data in readonly_group_list:
                    readonly_uuid_list.append(readonly_group_data['uuid'])
                for writeable_group_data in writeable_group_list:
                    writeable_uuid_list.append(writeable_group_data['uuid'])

                for record in session.run(stmt):
                    data_record = {}
                    data_record['uuid'] = record['entity_uuid']
                    data_record['entity_display_doi'] = record['entity_display_doi']
                    data_record['entity_doi'] = record['entity_doi']
                    data_record['datatype'] = record['datatype']
                    data_record['properties'] = record['metadata_properties']
                    data_record['hubmap_identifier'] = record['hubmap_identifier']
                    # determine if the record is writable by the current user
                    data_record['writeable'] = False
                    if 'provenance_group_uuid' in record['metadata_properties']:
                        if record['metadata_properties']['provenance_group_uuid'] in writeable_uuid_list:
                            data_record['writeable'] = True
                    return_list.append(data_record)
                return return_list                    
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

    def get_group_by_identifier(self, identifier):
        if len(identifier) == 0:
            raise ValueError("identifier cannot be blank")
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(
                self.entity_config['APP_CLIENT_ID'], self.entity_config['APP_CLIENT_SECRET'])
        else:
            authcache = AuthHelper.instance()
        groupinfo = authcache.getHuBMAPGroupInfo()
        # search through the keys for the identifier, return the value
        for k in groupinfo.keys():
            if str(k).lower() == str(identifier).lower():
                group = groupinfo.get(k)
                return group
            else:
                group = groupinfo.get(k)
                if str(group['uuid']).lower() == str(identifier).lower():
                    return group
        raise ValueError("cannot find a Hubmap group matching: [" + identifier + "]")

    def get_group_by_name(self, group_name):
        if len(group_name) == 0:
            raise ValueError("group_name cannot be blank")
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(
                self.entity_config['APP_CLIENT_ID'], self.entity_config['APP_CLIENT_SECRET'])
        else:
            authcache = AuthHelper.instance()
        groupinfo = authcache.getHuBMAPGroupInfo()
        # search through the keys for the identifier, return the value
        for k in groupinfo.values():
            if str(k['name']).lower() == str(group_name).lower()  or str(k['displayname']).lower() == str(group_name).lower():
                group = k
                return group
            if 'tmc_prefix' in k:
                if str(k['tmc_prefix']).lower() == str(group_name).lower():
                    group = k
                    return group

        raise ValueError("cannot find a Hubmap group matching: [" + group_name + "]")
        
    @staticmethod
    def get_entities_by_type(driver, type_code): 
        with driver.session() as session:
            return_list = []

            # by default assume Entity type
            type_attrib = HubmapConst.ENTITY_TYPE_ATTRIBUTE
            type_code = getTypeCode(type_code)

            try:
                stmt = "MATCH (a {{{type_attrib}: '{type_code}'}}) RETURN a.{uuid_attrib} as uuid".format(
                    type_attrib=type_attrib, type_code=type_code, uuid_attrib=HubmapConst.UUID_ATTRIBUTE)

                for record in session.run(stmt):
                    dataset_record = record['uuid']
                    return_list.append(dataset_record)
                return return_list                    
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

    @staticmethod
    def get_entities_by_metadata_attribute(driver, attribute_name, attribute_code): 
        with driver.session() as session:
            return_list = []

            try:
                stmt = "MATCH (e:Entity)-[:HAS_METADATA]-(m) WHERE m.{attribute_name} = '{attribute_code}' RETURN e.{uuid_attrib} as uuid".format(
                    attribute_name=attribute_name, attribute_code=attribute_code, uuid_attrib=HubmapConst.UUID_ATTRIBUTE)

                for record in session.run(stmt):
                    dataset_record = record['uuid']
                    return_list.append(dataset_record)
                return return_list                    
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

    @staticmethod
    def get_entity_count_by_type(driver, type_code): 
        try:
            entity_list = Entity.get_entities_by_type(driver, type_code)
            return len(entity_list)
        except CypherError as cse:
            print ('A Cypher error was encountered: '+ cse.message)
            raise
        except:
            print ('A general error occurred: ')
            for x in sys.exc_info():
                print (x)
            raise
        


    """This method builds a Cypher statement that returns a set of nodes constrained on the given UUID
    and relationship type.  This method also includes an optional "direction" parameter.  This can be used 
    to constrain the Cypher query further to only return the matching nodes adhering to the directionality of the query.
    For more details: https://neo4j.com/docs/cypher-manual/current/clauses/match/#directed-rels-and-variable.
    By default, the direction parameter is None.  This is the most inclusive parameter and will match nodes regardless of direction."""
    @staticmethod
    def get_entity_from_relationship_statement(identifier, relationship_label, direction=None):
        left_dir = ''
        right_dir = ''
        if str(direction).lower() not in ['left', 'right']:
            direction = None
        if str(direction).lower() == 'left':
            left_dir = '<'
        elif str(direction).lower() == 'right':
            right_dir = '>'
        stmt = "MATCH (e){left_dir}-[:{relationship_label}]-{right_dir}(a) WHERE e.{uuid_attrib}= '{identifier}' RETURN CASE WHEN e.{entitytype} is not null THEN e.{entitytype} WHEN e.{activitytype} is not null THEN e.{activitytype} ELSE e.{agenttype} END AS datatype, e.{uuid_attrib} AS uuid, e.{doi_attrib} AS doi, e.{doi_display_attrib} AS display_doi, e.{hubmap_identifier_attrib} AS hubmap_identifier, properties(a) AS properties".format(
            identifier=identifier,uuid_attrib=HubmapConst.UUID_ATTRIBUTE, doi_attrib=HubmapConst.DOI_ATTRIBUTE, doi_display_attrib=HubmapConst.DISPLAY_DOI_ATTRIBUTE,
                entitytype=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, agenttype=HubmapConst.AGENT_TYPE_ATTRIBUTE,
                hubmap_identifier_attrib=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,
                relationship_label=relationship_label, right_dir=right_dir, left_dir=left_dir)
        return stmt                  

    @staticmethod
    def get_entity_metadata(driver, identifier):
        entity_list = Entity.get_entities_by_relationship(driver, identifier, HubmapConst.HAS_METADATA_REL, "right")
        if len(entity_list) > 1:
            raise ValueError("Error: more than one metadata object found for identifier: " + identifier)
        if len(entity_list) == 0:
            raise ValueError("Error: no metadata object found for identifier: " + identifier)
        return entity_list[0]                  

    @staticmethod
    def get_entities_by_relationship(driver, identifier, relationship_label, direction=None): 
        with driver.session() as session:
            return_list = []

            try:
                stmt = Entity.get_entity_from_relationship_statement(identifier, relationship_label, direction)

                for record in session.run(stmt):
                    # add some data elements
                    # since metadata lacks doi and display_doi
                    # use the doi and display doi from the entity
                    dataset_record = record['properties']
                    #dataset_record['entity_uuid'] = record['uuid']
                    if record.get('hubmap_identifier', None) != None:
                        dataset_record['hubmap_identifier'] = record['hubmap_identifier']
                    dataset_record['doi'] = record['doi']
                    dataset_record['display_doi'] = record['display_doi']
                    #remove entitytype since it will be the other entity's type
                    dataset_record.pop('entitytype')
                    # re-insert the entity type corresponding to the original entity                    
                    dataset_record['entitytype'] = record['datatype']
                    return_list.append(dataset_record)
                return return_list                    
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

    @staticmethod
    def add_datafile_entity(self, driver, entity_uuid, activity_uuid, filepath, label): 
        # step 1: the filepath exists
        """TODO: fix this code
           check that the filepath exists
        """
        
        # step 2: check that the entity_uuid already exists
        if Entity.does_identifier_exist(driver, entity_uuid) != True:
            raise LookupError('Cannot find entity_uuid: ' + entity_uuid)        
        
        # step 3: check that the activity_uuid already exists
        if Entity.does_identifier_exist(driver, activity_uuid) != True:
            raise LookupError('Cannot find activity_uuid: ' + activity_uuid)        

        with driver.session() as session:
            tx = None
            try:
                #TODO: swap with Bill's code
                file_uuid = getNewUUID()

                tx = session.begin_transaction()
                # step 4: create the entity representing the file
                file_record = {HubmapConst.UUID_ATTRIBUTE : file_uuid,  
                                    HubmapConst.ENTITY_TYPE_ATTRIBUTE: HubmapConst.FILE_TYPE_CODE, HubmapConst.FILE_PATH_ATTRIBUTE: filepath }
                stmt = Neo4jConnection.get_create_statement(file_record, HubmapConst.ENTITY_NODE_NAME, HubmapConst.FILE_TYPE_CODE, False)
                tx.run(stmt)
                # step 5: create the associated activity
                #TODO: swap with Bill's code
                activity_uuid = getNewUUID()
                
                #TODO: Add provenance data in addition to the TIMESTAMP
                activity_record = {HubmapConst.UUID_ATTRIBUTE : activity_uuid, HubmapConst.ACTIVITY_TYPE_ATTRIBUTE : HubmapConst.ADD_FILE_ACTIVITY_TYPE_CODE}
                stmt = Neo4jConnection.get_create_statement(activity_record, HubmapConst.ACTIVITY_NODE_NAME, HubmapConst.ADD_FILE_ACTIVITY_TYPE_CODE, True)
                tx.run(stmt)                
                # step 6: create the relationships
                stmt = Neo4jConnection.create_relationship_statement(entity_uuid, HubmapConst.ACTIVITY_INPUT_REL, activity_uuid)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(activity_uuid, HubmapConst.ACTIVITY_OUTPUT_REL, file_uuid)
                tx.run(stmt)
                tx.commit()
                return file_uuid
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                if tx.closed() == False:
                    tx.rollback()
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                if tx.closed() == False:
                    tx.rollback()
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                if tx.closed() == False:
                    tx.rollback()

    @staticmethod
    #TODO: I could abstract this more with a signature like:
    #connect_entities(self, driver, orig_uuid, connected_uuid, relationship_activity_type_code)
    def derive_entity(self, driver, orig_uuid, derived_uuid): 
        
        # step 1: check that the uuids already exist
        if Entity.does_identifier_exist(orig_uuid) != True:
            raise LookupError('Cannot find orig_uuid: ' + orig_uuid)        
        if Entity.does_identifier_exist(derived_uuid) != True:
            raise LookupError('Cannot find derived_uuid: ' + derived_uuid)        
        
        with driver.session() as session:
            tx = None
            try:
                # step 2: create the associated activity
                #TODO: swap with Bill's code
                activity_uuid = getNewUUID()
                
                #TODO: Add provenance data in addition to the TIMESTAMP
                activity_record = {HubmapConst.UUID_ATTRIBUTE : activity_uuid, HubmapConst.ACTIVITY_TYPE_ATTRIBUTE : HubmapConst.DERIVED_ACTIVITY_TYPE_CODE}
                stmt = Neo4jConnection.get_create_statement(activity_record, HubmapConst.ACTIVITY_NODE_NAME, HubmapConst.DERIVED_ACTIVITY_TYPE_CODE, True)
                tx.run(stmt)                
                # step 5: create the relationships
                stmt = Neo4jConnection.create_relationship_statement(orig_uuid, HubmapConst.ACTIVITY_INPUT_REL, activity_uuid)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(activity_uuid, HubmapConst.ACTIVITY_OUTPUT_REL, derived_uuid)
                tx.run(stmt)
                tx.commit()
                return activity_uuid
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                if tx.closed() == False:
                    tx.rollback()
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                if tx.closed() == False:
                    tx.rollback()
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                if tx.closed() == False:
                    tx.rollback()

    @staticmethod
    def get_node_properties(driver, stmt, there_can_be_only_one=False): 
        with driver.session() as session:
            return_list = []
            try:
                for record in session.run(stmt):
                    entity_record = record['properties']
                    return_list.append(entity_record)
                if len(return_list) == 0:
                    raise LookupError('Unable to find entity in statement:' + stmt)
                if len(return_list) > 1 and there_can_be_only_one == True:
                    raise LookupError('Error more than one entity found in statement:' + stmt)
                if there_can_be_only_one == True:
                    return return_list[0]
                return return_list                    
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

def getTypeCode(type_code):
    typeCodeDict = {str(HubmapConst.DATASET_TYPE_CODE).lower() : HubmapConst.DATASET_TYPE_CODE,
                    str(HubmapConst.DATASTAGE_TYPE_CODE).lower() : HubmapConst.DATASTAGE_TYPE_CODE,
                    str(HubmapConst.SUBJECT_TYPE_CODE).lower() : HubmapConst.SUBJECT_TYPE_CODE,
                    str(HubmapConst.SOURCE_TYPE_CODE).lower() : HubmapConst.SOURCE_TYPE_CODE,
                    str(HubmapConst.SAMPLE_TYPE_CODE).lower() : HubmapConst.SAMPLE_TYPE_CODE,
                    str(HubmapConst.DONOR_TYPE_CODE).lower() : HubmapConst.DONOR_TYPE_CODE,
                    str(HubmapConst.FILE_TYPE_CODE).lower() : HubmapConst.FILE_TYPE_CODE,
                    str(HubmapConst.ORGAN_TYPE_CODE).lower() : HubmapConst.ORGAN_TYPE_CODE,
                    str(HubmapConst.SAMPLE_TYPE_CODE).lower() : HubmapConst.SAMPLE_TYPE_CODE,
                    str(HubmapConst.LAB_TYPE_CODE).lower() : HubmapConst.LAB_TYPE_CODE,
                    str(HubmapConst.DATASET_TYPE_CODE).lower() : HubmapConst.DATASET_TYPE_CODE,
                    str(HubmapConst.METADATA_TYPE_CODE).lower() : HubmapConst.METADATA_TYPE_CODE,
                    str(HubmapConst.COLLECTION_TYPE_CODE).lower() : HubmapConst.COLLECTION_TYPE_CODE,
                    
                    }
    return typeCodeDict[str(type_code).lower()]

if __name__ == "__main__":
    entity = Entity()
    conn = Neo4jConnection()
    driver = conn.get_driver()
    """group_info = entity.get_group_by_name('HuBMAP-UFlorida')
    print(group_info)
    group_info = entity.get_group_by_name('University of Florida TMC')
    print(group_info)
    group_info = entity.get_group_by_name('UFL')
    print(group_info)"""
    
    type_list = entity.get_entity_type_list(driver)
    print(type_list)
    
    entities_list = entity.get_entities_by_type(driver, 'daTaset')
    print(entities_list) 

    entities_count = entity.get_entity_count_by_type(driver, 'daTaset')
    print(entities_count) 
    
    
    entities_list = entity.get_entities_by_metadata_attribute(driver, HubmapConst.SPECIMEN_TYPE_ATTRIBUTE, 'ffpe_block')
    print(entities_list) 

    
    
    """token = "AggQN13V56BW10NMY9e18vPen0rEEeDW5aorWD39gBx1j48pwycJC31pG8WXdvYdevkD8vGJa210qxc1ke58WSBgD6"
    writeable_groups = entity.get_writeable_user_groups(token)
    print('Writeable groups:')
    print(writeable_groups)
    readonly_groups = entity.get_readonly_user_groups(token)
    print('Readonly groups:')
    print(readonly_groups)"""
    
    
    
    
    """conn = Neo4jConnection()
    driver = conn.get_driver()
    name = 'Test Dataset'
    description= 'This dataset is a test'
    parentCollection = '4470c8e8-3836-4986-9773-398912831'
    hasPHI = False
    labCreatedAt = '0ce5be9b-8b7f-47e9-a6d9-16a08df05f50'
    createdBy = '70a43e57-c4fd-4616-ad41-ca8c80d6d827'

    uuid_to_modify = 'b7094763d7d8581ce0cdcee2c59440c4'
    dr_x_uuid = '33a46e57-c55d-4617-ad41-ca8a30d6d844'
    metadata_uuid = '11ba247d1deac704fd1ee96c3619f527'
    register_datastage_activity = '177a1b530092b8bdd283c238e7d0166a'
    
    current_token = "AgeYjkWV9mr79xKqJNzX8ojdlGyvy9nvj9dw2eaqKjE0Km7eXzfVCPv6zYwmxmjoj1MGgByep61ewgIK3jjwkupPoa"

    entity = Entity()
    file_uuid = entity.get_entity(driver, uuid_to_modify)
    print (file_uuid)
    file_uuid = entity.get_entity(driver, metadata_uuid)
    print (file_uuid)
    file_uuid = entity.get_entity(driver, register_datastage_activity)
    print (file_uuid)
    
    stmt = Entity.get_entity_from_relationship_statement("cafd03e784d2fd091dd2bafc71db911d", "HAS_METADATA", "left")
    print(stmt)
    
    editable_entity = 'a3c44910213907cbc8d8d3fe53b63b53'
    status = entity.can_user_edit_entity(driver, current_token, editable_entity)
    if status == True:
        print ("I can edit " + editable_entity) 
    else:
        print ("I cannot edit " + editable_entity) 
    
    e_list = entity.get_editable_entities_by_type(driver, current_token, 'Donor')
    print(e_list)

    e_list = entity.get_editable_entities_by_type(driver, current_token)
    print(e_list)

    entity = Entity()
    #edit_record = {'uuid' : 'b8f5fcbe0b891ac0361b361b722de4b4', 'description' :'new description'}
    #entity.edit_entity(driver, current_token, 'b8f5fcbe0b891ac0361b361b722de4b4', edit_record)
    metadata_obj = Entity.get_entity_metadata(driver, '55f3673543e4843e04f7c19161b47104')
    print(metadata_obj)
    
    group_list = entity.get_user_groups(current_token)
    print(group_list)

    
    
    conn.close()"""
