export const createPageUrl = (pageName: string) => {
  switch (pageName) {
    case 'Home':
      return '/'
    case 'Privacy':
      return '/privacy'
    case 'Login':
      return '/login'
    default:
      return '/'
  }
}
