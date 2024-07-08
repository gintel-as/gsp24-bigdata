import sys
import requests
from requests.auth import HTTPBasicAuth
from elasticsearch import Elasticsearch
import ssl
import json

# Elasticsearch and Kibana configuration
kibana_url = 'http://localhost:5601'
es_host = 'https://localhost:9200'
es_user = 'elastic'
es_password = 'changeme'

kibana_user = 'kibana_admin'
kibana_password = 'changeme'

# Create SSL context
context = ssl.create_default_context(cafile="./cert/ca.crt")

# Initialize the Elasticsearch client with SSL context
es = Elasticsearch(
    [es_host],
    http_auth=(es_user, es_password),
    ssl_context=context
)

def query_correlation_ids(index, session_id_field, session_id):
    query = {
        "query": {
            "term": {
                session_id_field: session_id
            }
        }
    }
    response = es.search(index=index, body=query)
    hits = response['hits']['hits']
    correlation_ids = set()
    for hit in hits:
        correlation_ids.update(hit['_source']['correlationID'].split(','))
    return correlation_ids

# Function to query Elasticsearch for SIP files using correlation IDs
def query_sip_files(index, correlation_id_field, correlation_ids):
    query = {
        "query": {
            "terms": {
                correlation_id_field: list(correlation_ids)
            }
        },
        "sort": [
            {
                "time_parsed": {
                    "order": "asc"
                }
            }
        ]
    }
    response = es.search(index=index, body=query, size=10000)  # Adjust size as needed
    return response['hits']['hits']

# Main function
def main():
    if len(sys.argv) != 2:
        print("Usage: python script.py <session_id>")
        sys.exit(1)

    session_id = sys.argv[1]

    # Index and field names
    cdr_index = 'cdr_logs-2024.06.27'  # Replace with your CDR index name
    session_id_field = 'sessionID'  # Replace with the session ID field name in the CDR index
    sip_index = 'sip_logs-2024.06.27'  # Replace with your SIP index name
    correlation_id_field = 'sessionID'  # Replace with the correlation ID field name in the SIP index

    # Step 1: Retrieve correlation IDs from the session ID
    correlation_ids = query_correlation_ids(cdr_index, session_id_field, session_id)
    print(f"Retrieved correlation IDs: {correlation_ids}")

    # Step 2: Retrieve SIP files using correlation IDs
    sip_files = query_sip_files(sip_index, correlation_id_field, correlation_ids)
    
    # Output results to a text file
    output_file = 'sip_files.txt'
    with open(output_file, 'w') as f:
        for sip_file in sip_files:
            # Extract specific variables from the SIP file
            timestamp = sip_file['_source'].get('timestamp', '')
            log_level = sip_file['_source'].get('log_level', '')
            ip = sip_file['_source'].get('ip', '')
            sessionID = sip_file['_source'].get('sessionID', '')
            leg = sip_file['_source'].get('leg', '')
            text = sip_file['_source'].get('text', '')
            formatted_leg = '(' + ' ' * (14 - len(leg)) + leg + ')'
            formatted_sessionID = sessionID if len(sessionID) == 10 else ' ' + sessionID

            # Format the line
            formatted_line = f"{timestamp} {log_level}  [{ip}] {formatted_sessionID}: {formatted_leg} {text}\n"
            f.write(formatted_line)

    print(f"SIP files have been written to {output_file}")

if __name__ == "__main__":
    main()