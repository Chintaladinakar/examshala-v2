'use client';

import { useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import InputField from '@/components/InputField';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    institution: 'ABC University',
    role: 'Student',
  });

  const [editData, setEditData] = useState(profileData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profileData);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Profile updated:', editData);
    setProfileData(editData);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [field]: e.target.value });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-8 pb-8 border-b">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-4xl mr-6">
                👤
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                <p className="text-gray-600">{profileData.role}</p>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Full Name"
                    id="name"
                    value={editData.name}
                    onChange={handleChange('name')}
                    placeholder="Enter your full name"
                    required
                  />
                  <InputField
                    label="Username"
                    id="username"
                    value={editData.username}
                    onChange={handleChange('username')}
                    placeholder="Enter username"
                    required
                  />
                  <InputField
                    label="Email"
                    type="email"
                    id="email"
                    value={editData.email}
                    onChange={handleChange('email')}
                    placeholder="Enter email"
                    required
                  />
                  <InputField
                    label="Phone"
                    type="tel"
                    id="phone"
                    value={editData.phone}
                    onChange={handleChange('phone')}
                    placeholder="Enter phone number"
                  />
                  <InputField
                    label="Institution"
                    id="institution"
                    value={editData.institution}
                    onChange={handleChange('institution')}
                    placeholder="Enter institution name"
                  />
                  <InputField
                    label="Role"
                    id="role"
                    value={editData.role}
                    onChange={handleChange('role')}
                    disabled
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Full Name</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Username</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Institution</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData.institution}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Role</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Account Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">12</p>
                <p className="text-gray-600 mt-2">Tests Created</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">45</p>
                <p className="text-gray-600 mt-2">Tests Taken</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">78%</p>
                <p className="text-gray-600 mt-2">Average Score</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
