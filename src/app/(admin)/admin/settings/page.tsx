import { getSettings } from '@/actions/settings-actions'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { data: settings } = await getSettings()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-mist">Configure global parameters and rules for the RMSPS system.</p>
      </div>

      <SettingsClient initialSettings={settings || []} />
    </div>
  )
}
