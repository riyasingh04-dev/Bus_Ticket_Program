from datetime import date, datetime, time, timedelta

def parse_bus_time(time_str, base_date: date) -> datetime:
    """Parses a time string like '10:00AM' or '22:00' into a datetime object for a specific date."""
    if not time_str: 
        return datetime.combine(base_date, time(0, 0))
    
    # Clean time string (e.g. remove spaces)
    ts = time_str.strip().upper().replace(" ", "")
    try:
        # Handle formats like 10:00AM
        t_obj = datetime.strptime(ts, "%I:%M%p").time()
    except ValueError:
        try:
            # Handle formats like 22:00
            t_obj = datetime.strptime(ts, "%H:%M").time()
        except ValueError:
            # Fallback
            t_obj = time(0, 0)
            
    return datetime.combine(base_date, t_obj)

def is_available(bus, selected_date: date) -> bool:
    """Checks if a bus is available on a specific date based on its running pattern and time."""
    # 1. Pattern check
    pattern_matches = False
    if not bus.running_type or bus.running_type == "DAILY":
        pattern_matches = True
    elif bus.running_type == "ALTERNATE_DAYS":
        if not bus.start_date:
            pattern_matches = True
        else:
            diff = (selected_date - bus.start_date).days
            pattern_matches = diff >= 0 and diff % 2 == 0
    elif bus.running_type == "WEEKDAYS":
        if not bus.running_days:
            pattern_matches = True
        else:
            days_list = [d.strip().lower()[:3] for d in bus.running_days.split(",")]
            current_day = selected_date.strftime("%a").lower()
            pattern_matches = current_day in days_list
    elif bus.running_type == "WEEKENDS":
        pattern_matches = selected_date.weekday() in [5, 6]
    else:
        pattern_matches = True

    if not pattern_matches:
        return False
        
    # 2. Timing check for today
    if selected_date == date.today():
        # Current time comparison
        # Important: This assumes server time matches the system's local time zone.
        now = datetime.now()
        bus_dep = parse_bus_time(bus.departure_time, selected_date)
        if bus_dep < now:
            return False
            
    return True

def get_next_available_date(bus, from_date: date) -> date:
    """Calculates the next available date for a bus after the given date."""
    # Start checking from the day after from_date
    check_date = from_date + timedelta(days=1)
    # Limit search to 30 days to avoid infinite loops if pattern is invalid
    for _ in range(30):
        if is_available(bus, check_date):
            return check_date
        check_date += timedelta(days=1)
    return None

def get_pattern_label(bus) -> str:
    """Returns a user-friendly label for the bus's running pattern."""
    if not bus.running_type or bus.running_type == "DAILY":
        return "Runs Daily"
    if bus.running_type == "ALTERNATE_DAYS":
        return "Runs Every Alternate Day"
    if bus.running_type == "WEEKDAYS":
        return f"Runs on {bus.running_days}"
    if bus.running_type == "WEEKENDS":
        return "Runs on Weekends (Sat-Sun)"
    return "Custom Pattern"
