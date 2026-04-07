import sqlite3
import os

# Connect to the database
db_path = 'D:/Bus_Ticket_Program_AI/Backend/app.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def verify_stoppage_pricing():
    print("--- Stoppage-based Pricing Verification ---")
    
    try:
        # 1. Setup Test Data
        # Ensure Cities and Stops exist
        cursor.execute("INSERT OR IGNORE INTO cities (name) VALUES ('Delhi'), ('Jaipur')")
        cursor.execute("INSERT OR IGNORE INTO stops (name) VALUES ('Delhi Depot'), ('Gurugram Stop'), ('Jaipur Bus Stand')")
        conn.commit()
        
        # Get IDs
        cursor.execute("SELECT id FROM cities WHERE name='Delhi'")
        delhi_id = cursor.fetchone()[0]
        cursor.execute("SELECT id FROM cities WHERE name='Jaipur'")
        jaipur_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT id FROM stops WHERE name='Delhi Depot'")
        delhi_stop_id = cursor.fetchone()[0]
        cursor.execute("SELECT id FROM stops WHERE name='Gurugram Stop'")
        gurugram_stop_id = cursor.fetchone()[0]
        cursor.execute("SELECT id FROM stops WHERE name='Jaipur Bus Stand'")
        jaipur_stop_id = cursor.fetchone()[0]
        
        # Create Route
        cursor.execute("INSERT OR IGNORE INTO routes (source_id, destination_id) VALUES (?, ?)", (delhi_id, jaipur_id))
        conn.commit()
        cursor.execute("SELECT id FROM routes WHERE source_id=? AND destination_id=?", (delhi_id, jaipur_id))
        route_id = cursor.fetchone()[0]
        
        # Add Stoppages with Price From Start
        # Delhi (0), Gurugram (100), Jaipur (500)
        cursor.execute("DELETE FROM route_stoppages WHERE route_id=?", (route_id,))
        cursor.execute("INSERT INTO route_stoppages (route_id, stop_id, arrival_time, halt_duration, stop_order, price_from_start) VALUES (?, ?, '06:00', 0, 1, 0.0)", (route_id, delhi_stop_id))
        cursor.execute("INSERT INTO route_stoppages (route_id, stop_id, arrival_time, halt_duration, stop_order, price_from_start) VALUES (?, ?, '07:30', 10, 2, 100.0)", (route_id, gurugram_stop_id))
        cursor.execute("INSERT INTO route_stoppages (route_id, stop_id, arrival_time, halt_duration, stop_order, price_from_start) VALUES (?, ?, '11:00', 0, 3, 500.0)", (route_id, jaipur_stop_id))
        conn.commit()
        
        # 2. Test Pricing Logic
        # Case A: Delhi to Jaipur (500 - 0 = 500)
        cursor.execute("SELECT s1.price_from_start, s2.price_from_start FROM route_stoppages s1, route_stoppages s2 WHERE s1.route_id = ? AND s1.stop_id = ? AND s2.route_id = ? AND s2.stop_id = ?", (route_id, delhi_stop_id, route_id, jaipur_stop_id))
        p1, p2 = cursor.fetchone()
        print(f"Segment: Delhi -> Jaipur | Expected: 500.0 | Got: {p2 - p1}")
        
        # Case B: Gurugram to Jaipur (500 - 100 = 400)
        cursor.execute("SELECT s1.price_from_start, s2.price_from_start FROM route_stoppages s1, route_stoppages s2 WHERE s1.route_id = ? AND s1.stop_id = ? AND s2.route_id = ? AND s2.stop_id = ?", (route_id, gurugram_stop_id, route_id, jaipur_stop_id))
        p1, p2 = cursor.fetchone()
        print(f"Segment: Gurugram -> Jaipur | Expected: 400.0 | Got: {p2 - p1}")
        
        # Case C: Sequence Check (Should be s1.stop_order < s2.stop_order)
        cursor.execute("SELECT s1.stop_order, s2.stop_order FROM route_stoppages s1, route_stoppages s2 WHERE s1.route_id = ? AND s1.stop_id = ? AND s2.route_id = ? AND s2.stop_id = ?", (route_id, jaipur_stop_id, route_id, delhi_stop_id))
        o1, o2 = cursor.fetchone()
        print(f"Reverse Segment Check: Jaipur(Order {o1}) -> Delhi(Order {o2}) | Is Valid? {o1 < o2}")

        print("\n--- Logic Verification Completed Successfully ---")
        
    except Exception as e:
        print(f"Error during verification: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    verify_stoppage_pricing()
