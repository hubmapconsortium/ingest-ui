'''
Created on May 15, 2019

@author: chb69
'''
import os
import sys
sys.path.append(os.path.realpath("../common-api"))
from hubmap_const import HubmapConst
from hm_auth import AuthCache, AuthHelper
from entity import Entity
from uuid_generator import getNewUUID
from neo4j_connection import Neo4jConnection
from neo4j import TransactionError, CypherError
import configparser
from pprint import pprint
import json



class Specimen:

    @staticmethod
    # NOTE: This will return an entity, activity, or agent
    def get_specimen(self, driver, identifier):
        try:
            return Entity.get_entity(driver, identifier)
        except BaseException as be:
            pprint(be)
            raise be

    @staticmethod
    def create_specimen(driver, incoming_record, current_token, labUUID, sourceUUID=None):
        # step 1: check that the uuids already exist
        conn = Neo4jConnection()
        confdata = Specimen.load_config_file()
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(
                confdata['appclientid'], confdata['appclientsecret'])
        else:
            authcache = AuthHelper.instance()
        userinfo = authcache.getUserInfo(current_token, True)
        metadata_userinfo = {}

        if 'sub' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = userinfo['sub']
        if 'username' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['username']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
        activity_type = HubmapConst.REGISTER_DONOR_ACTIVITY_TYPE_CODE
        entity_type = incoming_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE]
        if entity_type == HubmapConst.TISSUE_TYPE_CODE:
            activity_type = HubmapConst.CREATE_TISSUE_ACTIVITY_TYPE_CODE
            if sourceUUID == None:
                raise ValueError('Error: sourceUUID must be set for ')

        #userinfo = AuthCache.userInfo(current_token, True)

        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                # step 2: create the associated activity
                specimen_data = {}
                specimen_uuid_record = getNewUUID(
                    current_token, incoming_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE])
                incoming_record[HubmapConst.UUID_ATTRIBUTE] = specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                incoming_record[HubmapConst.DOI_ATTRIBUTE] = specimen_uuid_record[HubmapConst.DOI_ATTRIBUTE]
                incoming_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = specimen_uuid_record['displayDoi']
                required_list = HubmapConst.DONOR_REQUIRED_ATTRIBUTE_LIST
                if entity_type == HubmapConst.TISSUE_TYPE_CODE:
                    required_list = HubmapConst.TISSUE_REQUIRED_ATTRIBUTE_LIST
                required_list = [o['attribute_name'] for o in required_list]
                for attrib in required_list:
                    specimen_data[attrib] = incoming_record.pop(attrib)
                stmt = Neo4jConnection.get_create_statement(
                    specimen_data, HubmapConst.ENTITY_NODE_NAME, entity_type, False)
                tx.run(stmt)

                metadata_record = incoming_record
                metadata_uuid_record = getNewUUID(
                    current_token, HubmapConst.METADATA_TYPE_CODE)
                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                metadata_record[HubmapConst.DOI_ATTRIBUTE] = metadata_uuid_record[HubmapConst.DOI_ATTRIBUTE]
                metadata_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = metadata_uuid_record['displayDoi']
                metadata_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_TYPE_CODE
                metadata_record[HubmapConst.REFERENCE_UUID_ATTRIBUTE] = specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]

                # This is temporary, I need a set of calls to extract the metadata and file info
                if 'metadata' in metadata_record.keys():
                    # TODO: see if the metadata stays here or needs to move to another section of code
                    # TODO I need to check to see if this data is json before I dump it as json
                    metadata_record['metadata'] = json.dumps(
                        metadata_record['metadata'])
                if 'files' in metadata_record.keys():
                    metadata_record.pop('files')
                if 'images' in metadata_record.keys():
                    metadata_record.pop('images')
                stmt = Neo4jConnection.get_create_statement(
                    metadata_record, HubmapConst.ENTITY_NODE_NAME, HubmapConst.METADATA_TYPE_CODE, True)
                tx.run(stmt)

                activity_uuid_record = getNewUUID(current_token, activity_type)
                activity_record = {HubmapConst.UUID_ATTRIBUTE: activity_uuid_record[HubmapConst.UUID_ATTRIBUTE],
                                   HubmapConst.DOI_ATTRIBUTE: activity_uuid_record[HubmapConst.DOI_ATTRIBUTE],
                                   HubmapConst.DISPLAY_DOI_ATTRIBUTE: activity_uuid_record['displayDoi'],
                                   HubmapConst.ACTIVITY_TYPE_ATTRIBUTE: activity_type}
                stmt = Neo4jConnection.get_create_statement(
                    activity_record, HubmapConst.ACTIVITY_NODE_NAME, activity_type, False)
                tx.run(stmt)

                activity_metadata_record = {}
                activity_metadata_uuid_record = getNewUUID(
                    current_token, HubmapConst.METADATA_TYPE_CODE)
                activity_metadata_record[HubmapConst.UUID_ATTRIBUTE] = activity_metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                activity_metadata_record[HubmapConst.DOI_ATTRIBUTE] = activity_metadata_uuid_record[HubmapConst.DOI_ATTRIBUTE]
                activity_metadata_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = activity_metadata_uuid_record['displayDoi']
                activity_metadata_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_TYPE_CODE
                activity_metadata_record[HubmapConst.REFERENCE_UUID_ATTRIBUTE] = activity_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                activity_metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
                activity_metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
                activity_metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[
                    HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
                stmt = Neo4jConnection.get_create_statement(
                    activity_metadata_record, HubmapConst.ENTITY_NODE_NAME, HubmapConst.METADATA_TYPE_CODE, True)
                tx.run(stmt)

                # step 5: create the relationships
                if entity_type == HubmapConst.TISSUE_TYPE_CODE:
                    stmt = Neo4jConnection.create_relationship_statement(
                        sourceUUID, HubmapConst.ACTIVITY_INPUT_REL, activity_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                    tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(
                    specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(
                    activity_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.ACTIVITY_OUTPUT_REL, specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(
                    activity_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, activity_metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                """stmt = Neo4jConnection.create_relationship_statement(specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.LAB_CREATED_AT_REL, labUUID)
                tx.run(stmt)"""
                tx.commit()
                return specimen_uuid_record
            except TransactionError as te:
                print('A transaction error occurred: ', te.value)
                tx.rollback()
            except CypherError as cse:
                print('A Cypher error was encountered: ', cse.message)
                tx.rollback()
            except:
                print('A general error occurred: ')
                for x in sys.exc_info():
                    print(x)
                tx.rollback()

    @staticmethod
    def load_config_file():
        config = configparser.ConfigParser()
        confdata = {}
        try:
            config.read('../common-api/config.ini')
            confdata['neo4juri'] = config.get('NEO4J', 'server')
            confdata['neo4jusername'] = config.get('NEO4J', 'username')
            confdata['neo4jpassword'] = config.get('NEO4J', 'password')
            confdata['appclientid'] = config.get('GLOBUS', 'APP_CLIENT_ID')
            confdata['appclientsecret'] = config.get(
                'GLOBUS', 'APP_CLIENT_SECRET')
            return confdata
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


if __name__ == "__main__":
    conn = Neo4jConnection()
    driver = conn.get_driver()
    name = 'Test Dataset'
    description = 'This dataset is a test'
    parentCollection = '4470c8e8-3836-4986-9773-398912831'
    hasPHI = False
    labCreatedAt = '0ce5be9b-8b7f-47e9-a6d9-16a08df05f50'
    createdBy = '70a43e57-c4fd-4616-ad41-ca8c80d6d827'

    uuid_to_modify = 'ec08e0ee-f2f6-4744-acb4-c4c6745eb04f'
    dr_x_uuid = '33a46e57-c55d-4617-ad41-ca8a30d6d844'
    datastage_uuid = 'c67a6dec-5ef8-4728-8f42-b70966edcb7e'
    create_datastage_activity = '05e699aa-0320-48ee-b3bc-f92cd72e9f5f'
    donor_uuid = 'aa7100ec-5e34-8628-3342-ac4566edcb22'
    current_token = 'AgBkdvv7dqN5oYG0peddbwmoO6l0ep5OD3ovmyJ4Dx99vwQ3B4cyCrM20k1j3nYz3nk65aM9lm2yVdik174abHW845'

    specimen_record = {'label': 'test specimen record',
                       'description': 'test specimen record',
                       'hasPHI': 'true', 'status': 'Published'}
    specimen_uuid_record = Specimen.create_specimen(
        driver, specimen_record,  current_token, labCreatedAt, parentCollection)
    conn.close()
