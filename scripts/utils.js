export function getPeriod(date, periods) {
    date = date.slice(5);
  
    for (const [key, ranges] of Object.entries(periods)) {
      for (const range of ranges) {
        const start = range.debut;
        const end = range.fin;
  
        if (date >= start && date <= end) {
          return key;
        }
      }
    }
    return "unknown";
  }
  