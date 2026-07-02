import React, { useEffect, useState } from 'react';
export default function ProfileView({ userEmail }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/get-profile?email=${encodeURIComponent(userEmail)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(data => setProfile(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [userEmail]);
  if (loading) {
    return <div className="text-center text-gray-500 mt-10">Loading profile...</div>;
  }
  if (!profile) {
    return <div className="text-center text-red-500 mt-10">Profile not found.</div>;
  }
  return (
    <div className="w-[310px] border-2 border-gray-800 rounded-xl overflow-hidden shadow-md font-sans mx-auto mt-10">
      <div className="bg-gray-900 color text-white p-4 text-center">
        <h3 className="m-0 uppercase tracking-wider font-bold text-sm">{profile.institution}</h3>
        <span className="text-[10px] text-gray-400">Student ID Card</span>
      </div>
      <div className="p-5 text-sm space-y-2 bg-white text-gray-700">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Roll No:</strong> {profile.rollNumber}</p>
        <p><strong>Class:</strong> {profile.class}</p>
        <p><strong>Emergency Contact:</strong> {profile.parentContact}</p>
      </div>
      <div className="bg-gray-50 text-center p-2 text-[11px] text-green-600 font-bold border-t border-gray-100 flex items-center justify-center gap-1">
        <span className="text-[8px]">●</span> VERIFIED STUDENT
      </div>
    </div>
  );
}
