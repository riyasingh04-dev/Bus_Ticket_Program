from datetime import date, datetime, timedelta, time
import sys
import os

# Add Backend to path
sys.path.append(os.path.join(os.getcwd(), 'Backend'))

from app.utils.availability import is_available, get_next_available_date

class MockBus:
    def __init__(self, running_type="DAILY", running_days=None, start_date=None, departure_time="10:00AM"):
        self.running_type = running_type
        self.running_days = running_days
        self.start_date = start_date
        self.departure_time = departure_time

def test():
    today = date.today()
    now = datetime.now()
    
    print(f"--- Verification Report ---")
    print(f"Current System Time: {now.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # 1. Test Daily Bus in the past
    past_time = (now - timedelta(hours=2)).strftime("%I:%M%p")
    bus_past = MockBus(running_type="DAILY", departure_time=past_time)
    avail_today = is_available(bus_past, today)
    print(f"Test 1 (Daily, Departs {past_time} - PAST):")
    print(f"  Available Today: {avail_today}")
    if not avail_today:
        next_date = get_next_available_date(bus_past, today)
        print(f"  Next Available Date: {next_date}")
    print("-" * 30)

    # 2. Test Daily Bus in the future
    future_time = (now + timedelta(hours=2)).strftime("%I:%M%p")
    bus_future = MockBus(running_type="DAILY", departure_time=future_time)
    avail_today_f = is_available(bus_future, today)
    print(f"Test 2 (Daily, Departs {future_time} - FUTURE):")
    print(f"  Available Today: {avail_today_f}")
    print("-" * 30)

    # 3. Test Alternate Days
    yesterday = today - timedelta(days=1)
    bus_alt = MockBus(running_type="ALTERNATE_DAYS", start_date=yesterday, departure_time="10:00AM")
    print(f"Test 3 (Alternate Days, Start=Yesterday):")
    print(f"  Available Today (Day 1): {is_available(bus_alt, today)}")
    print(f"  Available Tomorrow (Day 2): {is_available(bus_alt, today + timedelta(days=1))}")
    print(f"  Next Available after today: {get_next_available_date(bus_alt, today)}")
    print("-" * 30)

if __name__ == "__main__":
    test()
