import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex w-full h-full">
      {/* Hero Section */}
      <div className="relative flex items-center 
        justify-center h-screen overflow-hidden">
        <video autoPlay="{true}" loop muted
            className="absolute z-10 w-auto 
            min-w-full min-h-full max-w-none" src="/hero.mp4">
        </video>
      </div>
      {/*  */}
    </div>
  )
}