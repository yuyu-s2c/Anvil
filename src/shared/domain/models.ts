export function migrateModel(model: string): string {
  if (model === 'deepseek-chat') return 'deepseek-v4-flash'
  if (model === 'deepseek-reasoner') return 'deepseek-v4-pro'
  return model
}
