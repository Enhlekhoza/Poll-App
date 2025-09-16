export function LandingFooter() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-20">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; 2025 PollMaster. All rights reserved.</p>
        {/* You can add more links here like Privacy Policy, Terms of Service etc. */}
        <div className="flex justify-center space-x-4 mt-4">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}
