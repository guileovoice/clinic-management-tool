import { SMSPanel } from "@/components/sms/SMSPanel"

export const metadata = {
  title: 'SMS | GuileoAI',
  description: 'Manage patient conversations and SMS configurations via Twilio',
}

export default function SMSPage() {
  return (
    <div className="flex flex-col h-full bg-[#0B141A]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222E35] bg-[#202C33] z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">SMS Connectivity</h1>
          <p className="text-sm text-[#8696A0] mt-1">
            Chat with patients via Twilio SMS and manage notification channels.
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <SMSPanel />
      </div>
    </div>
  )
}
