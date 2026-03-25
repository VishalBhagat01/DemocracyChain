from neo4j import GraphDatabase
import os
from dotenv import load_dotenv
import sys

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

def create_seed_data():
    """Create seed data in Neo4j"""
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        
        with driver.session() as session:
            # Clear existing data
            session.run("MATCH (n) DETACH DELETE n")
            
            # Create constituencies
            constituencies = [
                {"name": "North Delhi", "code": "NORTH_01"},
                {"name": "South Delhi", "code": "SOUTH_01"},
                {"name": "East Delhi", "code": "EAST_01"}
            ]
            
            for const in constituencies:
                session.run(
                    "CREATE (c:Constituency {name: $name, code: $code})",
                    name=const["name"],
                    code=const["code"]
                )
            
            # Create booths
            booths = [
                {"constituency": "North Delhi", "booth_id": "BOOTH_001", "location": "School A"},
                {"constituency": "North Delhi", "booth_id": "BOOTH_002", "location": "School B"},
                {"constituency": "North Delhi", "booth_id": "BOOTH_003", "location": "School C"},
                {"constituency": "South Delhi", "booth_id": "BOOTH_004", "location": "College A"},
                {"constituency": "South Delhi", "booth_id": "BOOTH_005", "location": "College B"},
                {"constituency": "East Delhi", "booth_id": "BOOTH_006", "location": "Community Center"},
            ]
            
            for booth in booths:
                session.run(
                    """
                    MATCH (c:Constituency {name: $constituency})
                    CREATE (b:Booth {booth_id: $booth_id, location: $location})
                    CREATE (c)-[:HAS_BOOTH]->(b)
                    """,
                    constituency=booth["constituency"],
                    booth_id=booth["booth_id"],
                    location=booth["location"]
                )
            
            # Create voters
            for i in range(1, 101):
                session.run(
                    """
                    MATCH (b:Booth)
                    WHERE b.booth_id = $booth_id
                    CREATE (v:Voter {voter_id: $voter_id, name: $name})
                    CREATE (v)-[:VOTES_FROM]->(b)
                    """,
                    booth_id=f"BOOTH_{((i-1) % 6) + 1:03d}",
                    voter_id=f"VOTER_{i:04d}",
                    name=f"Voter {i}"
                )
            
            # Create issues
            issues = ["Drinking Water", "Roads", "Healthcare", "Education", "Electricity"]
            for issue in issues:
                session.run(
                    "CREATE (i:Issue {name: $name})",
                    name=issue
                )
            
            # Link voters to issues
            for i in range(1, 101):
                session.run(
                    """
                    MATCH (v:Voter {voter_id: $voter_id})
                    MATCH (i:Issue {name: $issue})
                    CREATE (v)-[:CONCERNED_ABOUT]->(i)
                    """,
                    voter_id=f"VOTER_{i:04d}",
                    issue=issues[(i % len(issues))]
                )
        
        print("✓ Seed data created successfully")
        driver.close()
        
    except Exception as e:
        print(f"✗ Error creating seed data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_seed_data()
