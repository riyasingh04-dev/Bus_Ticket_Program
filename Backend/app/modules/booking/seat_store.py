"""
In-memory seat lock store.
No database required — locks live in RAM with TTL enforcement.
Auto-cleanup on every read/write.
"""
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Dict, Optional

LOCK_DURATION_SECONDS = 120  # 2 minutes

class SeatLockStore:
    """Thread-safe, schedule-scoped seat lock registry."""

    def __init__(self):
        self._store: Dict[int, Dict[str, dict]] = {}  # {schedule_id: {seat: {user_id, expires_at}}}
        self._mutex = Lock()

    def _cleanup_schedule(self, schedule_id: int):
        """Remove expired locks for a given schedule (call inside mutex)."""
        if schedule_id not in self._store:
            return
        now = datetime.now(timezone.utc)
        expired = [
            seat for seat, info in self._store[schedule_id].items()
            if info["expires_at"] <= now
        ]
        for seat in expired:
            del self._store[schedule_id][seat]

    def lock_seats(self, schedule_id: int, seats: list[str], user_id: int) -> datetime:
        """
        Lock one or more seats for user_id for LOCK_DURATION_SECONDS.
        Returns expiry datetime.
        Raises ValueError if any seat is locked by another user.
        """
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=LOCK_DURATION_SECONDS)
        with self._mutex:
            self._cleanup_schedule(schedule_id)
            if schedule_id not in self._store:
                self._store[schedule_id] = {}

            # Pre-check all seats
            for seat in seats:
                existing = self._store[schedule_id].get(seat)
                if existing and existing["user_id"] != user_id:
                    raise ValueError(f"Seat {seat} is currently locked by another user.")

            # Apply locks
            for seat in seats:
                self._store[schedule_id][seat] = {
                    "user_id": user_id,
                    "expires_at": expires_at,
                }
        return expires_at

    def release_seats(self, schedule_id: int, user_id: int):
        """Release all seats locked by user_id in this schedule."""
        with self._mutex:
            if schedule_id not in self._store:
                return
            to_remove = [
                seat for seat, info in self._store[schedule_id].items()
                if info["user_id"] == user_id
            ]
            for seat in to_remove:
                del self._store[schedule_id][seat]

    def get_locked_seats(self, schedule_id: int) -> Dict[str, dict]:
        """
        Returns {seat: {user_id, expires_at}} for all active locks in a schedule.
        Expired locks are auto-cleaned before returning.
        """
        with self._mutex:
            self._cleanup_schedule(schedule_id)
            return dict(self._store.get(schedule_id, {}))

    def is_locked_by_other(self, schedule_id: int, seat: str, user_id: int) -> bool:
        """Return True if seat is locked by someone other than user_id."""
        with self._mutex:
            self._cleanup_schedule(schedule_id)
            info = self._store.get(schedule_id, {}).get(seat)
            if not info:
                return False
            return info["user_id"] != user_id


# Singleton — imported everywhere
seat_lock_store = SeatLockStore()
