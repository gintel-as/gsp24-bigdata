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

# Function to query Elasticsearch
def query_elasticsearch(index, field_name, session_id):
    query = {
        "query": {
            "wildcard": {
                field_name: f"*{session_id}*"
            }
        }
    }
    response = es.search(index=index, body=query)
    return response['hits']['hits'], response['hits']['total']['value']

# Main function
def main():
    session_id = input("Enter session ID: ")

    # List of indices and corresponding session ID field names
    index_field_pairs = [
        ('adapter_logs-2024.06.26', 'code'),
        #('at_logs-2024.06.26', 'field_name2'),
        ('cdr_logs-2024.06.26', 'correlationID'),
        ('server_logs-2024.06.26', 'log_message')
    ]

    results = {}

    for index, field_name in index_field_pairs:
        hits, total_hits = query_elasticsearch(index, field_name, session_id)
        results[index] = {
            'hits': hits,
            'total_hits': total_hits
        }

# Output results to a file
    output_file = 'results.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"Results have been written to {output_file}")

    # Optionally, print the results to the console
    for index, result in results.items():
        print(f"\nResults from {index}:")
        print(f"Number of hits: {result['total_hits']}")
        for hit in result['hits']:
            print(json.dumps(hit, indent=2))

if __name__ == "__main__":
    main()