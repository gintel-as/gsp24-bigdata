import requests
from requests.auth import HTTPBasicAuth
from elasticsearch import Elasticsearch
import ssl

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

# Query to get the list of unique companies from Elasticsearch
def get_unique_companies(es, index_pattern):
    query = {
        "size": 0,
        "aggs": {
            "unique_companies": {
                "terms": {
                    "field": "company_id.keyword",
                    "size": 10000  # Adjust size according to the expected number of unique companies
                }
            }
        }
    }
    response = es.search(index=index_pattern, body=query)
    print(response)
    companies = [bucket['key'] for bucket in response['aggregations']['unique_companies']['buckets']]
    return companies

# Get the list of companies
index_pattern = 'api_logs-2024.06.21'
companies = get_unique_companies(es, index_pattern)

# Iterate through the list of companies to create roles, users, and spaces
print(companies)
for company in companies:
    if company == '-':
        continue
    # Elasticsearch role and user setup
    print(company)
    role_name = f"{company.lower()}_role"
    role_body = {
        "cluster": ["all"],
        "indices": [
            {
                "names": [index_pattern],
                "privileges": ["read"],
                "query": {
                    "term": { "company_id": company }
                }
            }
        ],
        "applications": [
            {
                "application": "kibana-.kibana",
                "privileges": ["all"],
                "resources": [f"space/{company.lower()}"]
            }
        ]
    }
    es.security.put_role(name=role_name, body=role_body)
    print(f"Created role: {role_name}")

    user_name = f"{company.lower()}_user"
    user_body = {
        "password": "password123",
        "roles": [role_name],
        "full_name": f"{company} User",
        "email": f"user@{company.lower()}.com"
    }
    es.security.put_user(username=user_name, body=user_body)
    print(f"Created user: {user_name}")

    # Kibana space setup
    space_id = company.lower()
    space_body = {
        "id": space_id,
        "name": f"{company} Space",
        "description": f"Space for {company} dashboards and visualizations",
        "disabledFeatures": []
    }
    response = requests.post(
        f"{kibana_url}/api/spaces/space",
        json=space_body,
        auth=HTTPBasicAuth(kibana_user, kibana_password),
        headers={'kbn-xsrf': 'true'}
    )
    if response.status_code == 200:
        print(f"Created space: {space_id}")
        # Construct and log the space URL
        space_url = f"{kibana_url}/s/{space_id}/app/kibana"
        print(f"Space URL: {space_url}")
    else:
        print(f"Failed to create space: {space_id}, {response.text}")

print("Completed creating roles, users, and spaces for all companies.")
