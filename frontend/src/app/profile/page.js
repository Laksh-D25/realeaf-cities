 'use client';
 import React, { useEffect, useRef, useState } from 'react';
 import useUserStore from '@/store/auth';
 import { Loader2, Camera, User, Mail, Phone, Calendar, CheckCircle2 } from 'lucide-react';
 import Image from 'next/image';
 
 export default function ProfilePage() {
 	const {
 		user,
 		profile,
 		isLoading,
 		isInitialized,
 		initialize,
 		updateProfile,
 		uploadAvatar,
 		refreshProfile,
 		error
 	} = useUserStore();
 
 	const [form, setForm] = useState({
 		full_name: '',
 		phone: '',
 		bio: '',
 		date_of_birth: '' ,
 		subscribed_to_newsletters: false
 	});
 	const [saving, setSaving] = useState(false);
 	const [savedBanner, setSavedBanner] = useState(false);
 	const fileInputRef = useRef(null);
 
 	useEffect(() => {
 		if (!isInitialized) {
 			initialize();
 		}
 	}, [isInitialized, initialize]);
 
 	useEffect(() => {
 		if (profile) {
 			setForm({
 				full_name: profile.full_name || '',
 				phone: profile.phone || '',
 				bio: profile.bio || '',
 				date_of_birth: profile.date_of_birth ? profile.date_of_birth.substring(0, 10) : '',
 				subscribed_to_newsletters: Boolean(profile.subscribed_to_newsletters)
 			});
 		}
 	}, [profile]);
 
 	const handleChange = (key, value) => {
 		setForm(prev => ({ ...prev, [key]: value }));
 	};
 
 	const handleAvatarClick = () => fileInputRef.current?.click();
 
 	const handleAvatarChange = async (e) => {
 		const file = e.target.files?.[0];
 		if (!file) return;
 		setSaving(true);
 		const res = await uploadAvatar(file);
 		if (res?.success) await refreshProfile();
 		setSaving(false);
 	};
 
 	const handleSave = async () => {
 		setSaving(true);
 		const result = await updateProfile({
 			full_name: form.full_name,
 			phone: form.phone,
 			bio: form.bio,
 			date_of_birth: form.date_of_birth || null,
 			subscribed_to_newsletters: form.subscribed_to_newsletters
 		});
 		if (result?.success) {
 			setSavedBanner(true);
 			setTimeout(() => setSavedBanner(false), 2500);
 		}
 		setSaving(false);
 	};
 
 	return (
 		<div className="min-h-screen bg-gradient-to-br from-[var(--bg-from)] to-[var(--bg-to)]/40 px-4 py-8">
 			<div className="mx-auto max-w-5xl">
 				<div className="mb-8">
 					<h1 className="text-3xl font-extrabold text-[#104911] tracking-tight">My Profile</h1>
 					<p className="text-[#104911]/70">Manage your account details, preferences, and avatar.</p>
 				</div>
 
 				{savedBanner && (
 					<div className="mb-6 flex items-center gap-2 rounded-md border border-[var(--border)] bg-white/80 px-4 py-3 text-[#104911]">
 						<CheckCircle2 className="h-5 w-5 text-[#548C2F]" />
 						<span>Profile updated successfully.</span>
 					</div>
 				)}
 
 				<div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
 					{/* Avatar and summary */}
 					<div className="rounded-lg border border-[var(--border)] bg-white p-6">
 						<div className="flex flex-col items-center text-center">
 							<div className="relative">
 								{profile?.avatar_url ? (
 									<Image src={profile.avatar_url} alt="Avatar" width={112} height={112} className="h-28 w-28 rounded-full object-cover" />
 								) : (
 									<div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#A8D5E2] text-[#104911] text-3xl font-bold">
 										{(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
 									</div>
 								)}
 								<button onClick={handleAvatarClick} className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-full bg-[#F9A620] px-3 py-1 text-xs font-semibold text-[#104911] hover:bg-[#FFD449]">
 									<Camera className="h-3.5 w-3.5" /> Change
 								</button>
 								<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
 							</div>
 							<div className="mt-4">
 								<h2 className="text-xl font-bold text-[#104911]">{profile?.full_name || 'Your Name'}</h2>
 								<p className="text-sm text-[#104911]/80">{user?.email || 'your@email.com'}</p>
 							</div>
 							<div className="mt-4 grid grid-cols-2 gap-3">
 								<a href="/events" className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[#A8D5E2]/30">My Events</a>
 								<a href="/waste-management" className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[#A8D5E2]/30">Waste Requests</a>
 							</div>
 						</div>
 					</div>
 
 					{/* Form */}
 					<div className="rounded-lg border border-[var(--border)] bg-white p-6">
 						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 							<label className="block">
 								<span className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#104911]"><User className="h-4 w-4" /> Full name</span>
 								<input value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} className="w-full rounded-md border border-[var(--border)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="Your full name" />
 							</label>
 							<label className="block">
 								<span className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#104911]"><Phone className="h-4 w-4" /> Phone</span>
 								<input value={form.phone} onChange={e => handleChange('phone', e.target.value)} className="w-full rounded-md border border-[var(--border)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="Phone number" />
 							</label>
 							<label className="md:col-span-2 block">
 								<span className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#104911]"><Mail className="h-4 w-4" /> Email</span>
 								<input value={user?.email || ''} disabled className="w-full cursor-not-allowed rounded-md border border-[var(--border)] bg-gray-50 px-3 py-2 text-gray-600" />
 							</label>
 							<label className="block md:col-span-2">
 								<span className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#104911]"><Calendar className="h-4 w-4" /> Date of birth</span>
 								<input type="date" value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} className="w-full rounded-md border border-[var(--border)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
 							</label>
 							<label className="block md:col-span-2">
 								<span className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#104911]">Bio</span>
 								<textarea value={form.bio} onChange={e => handleChange('bio', e.target.value)} rows={4} className="w-full rounded-md border border-[var(--border)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="Tell us about yourself..." />
 							</label>
 							<label className="flex items-center gap-2 md:col-span-2">
 								<input type="checkbox" checked={form.subscribed_to_newsletters} onChange={e => handleChange('subscribed_to_newsletters', e.target.checked)} className="h-4 w-4" />
 								<span className="text-sm text-[#104911]">Subscribe to newsletters</span>
 							</label>
 						</div>
 						<div className="mt-6 flex items-center justify-end gap-3">
 							<button onClick={() => refreshProfile()} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[#A8D5E2]/30">Reset</button>
 							<button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[#548C2F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#104911] disabled:opacity-60">
 								{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
 							</button>
 						</div>
 					</div>
 				</div>
 
 				{error && (
 					<p className="mt-6 text-sm text-red-600">{error}</p>
 				)}
 			</div>
 		</div>
 	);
 }
