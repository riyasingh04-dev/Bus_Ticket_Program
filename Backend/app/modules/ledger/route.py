from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, RoleChecker
from app.modules.ledger.schema import LedgerResponse, LedgerSummary
from app.modules.ledger.service import get_ledger_summary, get_ledger_history

router = APIRouter()
admin_only = RoleChecker(["admin"])

@router.get("/summary", response_model=LedgerSummary)
def fetch_ledger_summary(db: Session = Depends(get_db), current_user = Depends(admin_only)):
    """
    Returns aggregated revenue statistics by agent, bus, and route.
    """
    return get_ledger_summary(db)

@router.get("/history", response_model=List[LedgerResponse])
def fetch_ledger_history(db: Session = Depends(get_db), current_user = Depends(admin_only)):
    """
    Returns a chronological list of all financial transactions.
    """
    return get_ledger_history(db)
