export const APP_USER = {
    name: 'TheMinggu',
    role: 'Super Admin',
    initials: 'TM',
}

export function getUserInitials(name: string = APP_USER.name): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'A'
}
