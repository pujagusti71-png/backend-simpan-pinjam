export const APP_USER = {
    name: 'Ahmad Rizal',
    role: 'Super Admin',
    initials: 'AR',
}

export function getUserInitials(name: string = APP_USER.name): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'A'
}
