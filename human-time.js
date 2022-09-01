export function toHuman(inHours) {
    const lessThanHour = parseFloat(inHours.replace(',', '.')) < 1
    return lessThanHour ? `${(parseFloat(inHours.replace(',', '.')) * 60).toFixed(0)}m` : inHours
}