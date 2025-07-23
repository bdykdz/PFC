// Map of hardcoded Tailwind colors to CSS variable classes
export const colorMap = {
  // Gray colors
  'text-gray-400': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-700': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-900': 'text-foreground',
  
  'dark:text-gray-200': 'dark:text-foreground',
  'dark:text-gray-300': 'dark:text-foreground',
  'dark:text-gray-400': 'dark:text-muted-foreground',
  
  'bg-gray-50': 'bg-muted/50',
  'bg-gray-100': 'bg-muted',
  'bg-gray-200': 'bg-muted',
  'bg-gray-800': 'bg-background',
  'bg-gray-900': 'bg-background',
  
  'dark:bg-gray-700': 'dark:bg-muted',
  'dark:bg-gray-800': 'dark:bg-background',
  'dark:bg-gray-900': 'dark:bg-background',
  
  'hover:bg-gray-100': 'hover:bg-muted',
  'dark:hover:bg-gray-700': 'dark:hover:bg-muted',
  
  // Blue colors
  'text-blue-500': 'text-primary',
  'text-blue-600': 'text-primary',
  'bg-blue-100': 'bg-primary/10',
  'bg-blue-200': 'bg-primary/20',
  'dark:from-blue-800': 'dark:from-primary/20',
  'dark:to-blue-900': 'dark:to-primary/10',
  
  // Red colors
  'text-red-500': 'text-destructive',
  'text-red-600': 'text-destructive',
  'text-red-800': 'text-destructive-foreground',
  'bg-red-100': 'bg-destructive/10',
  'dark:bg-red-900': 'dark:bg-destructive/20',
  'dark:text-red-100': 'dark:text-destructive-foreground',
  
  // Green colors
  'text-green-800': 'text-green-700 dark:text-green-300',
  'bg-green-100': 'bg-green-500/10',
  'dark:bg-green-900': 'dark:bg-green-500/20',
  'dark:text-green-100': 'dark:text-green-300',
  
  // Yellow colors
  'text-yellow-800': 'text-yellow-700 dark:text-yellow-300',
  'bg-yellow-100': 'bg-yellow-500/10',
  'dark:bg-yellow-900': 'dark:bg-yellow-500/20',
  'dark:text-yellow-100': 'dark:text-yellow-300',
  
  // Orange colors
  'from-orange-100': 'from-orange-500/10',
  'to-orange-200': 'to-orange-500/20',
  'dark:from-orange-800': 'dark:from-orange-500/20',
  'dark:to-orange-900': 'dark:to-orange-500/10',
}