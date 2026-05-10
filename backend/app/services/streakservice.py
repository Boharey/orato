from datetime import date, timedelta

def calculate_streaks(sorted_dates: list[str]) -> dict:
    if not sorted_dates:
        return {"current_streak": 0, "longest_streak": 0}

    dates = sorted(set(date.fromisoformat(d) for d in sorted_dates))

    # Longest streak
    longest = 1
    run = 1
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    # Current streak (must be active today or yesterday)
    today = date.today()
    yesterday = today - timedelta(days=1)
    current = 0
    if dates[-1] in (today, yesterday):
        current = 1
        for i in range(len(dates) - 2, -1, -1):
            if (dates[i + 1] - dates[i]).days == 1:
                current += 1
            else:
                break

    return {"current_streak": current, "longest_streak": longest}