export type Language = 'en' | 'hi' | 'bn';

export interface Translations {
  // Common
  app_name: string;
  loading: string;
  cancel: string;
  save: string;
  confirm: string;
  success: string;
  error: string;
  close: string;
  view_details: string;
  phone: string;
  optional: string;

  // Worker Nav
  nav_home: string;
  nav_my_work: string;
  nav_attendance: string;
  nav_profile: string;

  // Worker Home
  greeting_morning: string;
  greeting_afternoon: string;
  greeting_evening: string;
  worker_id_label: string;
  todays_work: string;
  assigned_location: string;
  team_leader: string;
  work_time: string;
  no_work_today: string;

  // Attendance Actions
  start_work: string;
  start_work_desc: string;
  work_started: string;
  work_started_desc: string;
  end_work: string;
  end_work_desc: string;
  day_completed: string;
  day_completed_desc: string;
  take_work_photo: string;
  take_work_photo_desc: string;
  attendance_success: string;
  photo_saved_success: string;
  ask_leader_help: string;

  // Work Categories
  photo_cat_before: string;
  photo_cat_during: string;
  photo_cat_after: string;

  // My Work
  status_new: string;
  status_ready: string;
  status_working: string;
  status_completed: string;
  view_location: string;
  open_maps: string;
  mark_complete: string;

  // Attendance History
  check_in: string;
  check_out: string;
  total_hours: string;
  status_present: string;
  status_absent: string;
  status_late: string;
  status_leave: string;

  // Profile
  my_profile: string;
  language_select: string;
  logout: string;

  // Leader Nav & Home
  leader_home: string;
  leader_my_team: string;
  leader_assign_work: string;
  leader_attendance: string;
  leader_profile: string;
  leader_evidence: string;

  summary_total_workers: string;
  summary_present: string;
  summary_absent: string;
  summary_not_checked_in: string;

  btn_add_worker: string;
  btn_assign_work: string;
  btn_take_attendance: string;
  btn_view_team: string;

  // Leader My Team & Add Worker
  worker_added_success: string;
  full_name: string;
  worker_role: string;
  action_view: string;
  action_edit: string;
  action_remove: string;

  // Leader Assign Work 3-Step
  step1_title: string;
  step2_title: string;
  step3_title: string;
  choice_individual: string;
  choice_team: string;
  select_location: string;
  select_date: string;
  btn_assign_confirm: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    app_name: 'WorkCrew',
    loading: 'Loading...',
    cancel: 'Cancel',
    save: 'Save',
    confirm: 'Confirm',
    success: 'Success',
    error: 'Error',
    close: 'Close',
    view_details: 'View Details',
    phone: 'Phone Number',
    optional: 'Optional',

    nav_home: 'Home',
    nav_my_work: 'My Work',
    nav_attendance: 'Attendance',
    nav_profile: 'Profile',

    greeting_morning: 'Good morning',
    greeting_afternoon: 'Good afternoon',
    greeting_evening: 'Good evening',
    worker_id_label: 'Worker ID',
    todays_work: "Today's Work",
    assigned_location: 'Work Location',
    team_leader: 'Team Leader',
    work_time: 'Working Hours',
    no_work_today: 'No work orders scheduled for today.',

    start_work: 'START WORK',
    start_work_desc: 'Tap to take selfie & begin your day',
    work_started: 'WORK STARTED',
    work_started_desc: 'Checked in at',
    end_work: 'END WORK',
    end_work_desc: 'Tap to take selfie & complete duty',
    day_completed: 'DAY COMPLETED',
    day_completed_desc: 'Shift completed for today',
    take_work_photo: 'TAKE WORK PHOTO',
    take_work_photo_desc: 'Before / Progress / Completed photos',
    attendance_success: 'Attendance Submitted Successfully',
    photo_saved_success: 'Photo Saved Successfully',
    ask_leader_help: 'Ask Team Leader for Help',

    photo_cat_before: 'BEFORE WORK',
    photo_cat_during: 'WORK IN PROGRESS',
    photo_cat_after: 'WORK COMPLETED',

    status_new: 'New Work',
    status_ready: 'Ready to Start',
    status_working: 'Working',
    status_completed: 'Completed',
    view_location: 'View Location',
    open_maps: 'Open Map Navigation',
    mark_complete: 'Mark Work Complete',

    check_in: 'Check-in',
    check_out: 'Check-out',
    total_hours: 'Total Hours',
    status_present: 'Present',
    status_absent: 'Absent',
    status_late: 'Late',
    status_leave: 'Leave',

    my_profile: 'My Profile',
    language_select: 'App Language',
    logout: 'Log Out',

    leader_home: 'Home',
    leader_my_team: 'My Team',
    leader_assign_work: 'Assign Work',
    leader_attendance: 'Attendance',
    leader_profile: 'Profile',
    leader_evidence: 'Photos & Proofs',

    summary_total_workers: 'Total Workers',
    summary_present: 'Present Today',
    summary_absent: 'Absent',
    summary_not_checked_in: 'Not Checked In',

    btn_add_worker: 'ADD WORKER',
    btn_assign_work: 'ASSIGN WORK',
    btn_take_attendance: 'TAKE ATTENDANCE',
    btn_view_team: 'VIEW TEAM',

    worker_added_success: 'Worker Added Successfully',
    full_name: 'Full Name',
    worker_role: 'Role / Trade',
    action_view: 'View',
    action_edit: 'Edit',
    action_remove: 'Remove',

    step1_title: 'Step 1: WHAT WORK?',
    step2_title: 'Step 2: WHO WILL WORK?',
    step3_title: 'Step 3: WHERE AND WHEN?',
    choice_individual: 'INDIVIDUAL WORKERS',
    choice_team: 'ENTIRE TEAM',
    select_location: 'Select Work Location',
    select_date: 'Select Work Date',
    btn_assign_confirm: 'ASSIGN WORK',
  },

  hi: {
    app_name: 'WorkCrew (वर्कक्रू)',
    loading: 'लोड हो रहा है...',
    cancel: 'रद्द करें',
    save: 'सुरक्षित करें',
    confirm: 'पुष्टि करें',
    success: 'सफल',
    error: 'त्रुटि',
    close: 'बंद करें',
    view_details: 'विवरण देखें',
    phone: 'मोबाइल नंबर',
    optional: 'वैकल्पिक',

    nav_home: 'होम',
    nav_my_work: 'मेरा काम',
    nav_attendance: 'हाजिरी',
    nav_profile: 'प्रोफाइल',

    greeting_morning: 'नमस्ते / सुप्रभात',
    greeting_afternoon: 'शुभ दोपहर',
    greeting_evening: 'शुभ संध्या',
    worker_id_label: 'कर्मचारी आईडी',
    todays_work: 'आज का काम',
    assigned_location: 'कार्य स्थल',
    team_leader: 'टीम लीडर',
    work_time: 'कार्य समय',
    no_work_today: 'आज के लिए कोई काम आवंटित नहीं है।',

    start_work: 'काम शुरू करें (START WORK)',
    start_work_desc: 'सेल्फी लें और हाजिरी दर्ज करें',
    work_started: 'काम शुरू हो चुका है',
    work_started_desc: 'चेक-इन का समय:',
    end_work: 'काम समाप्त करें (END WORK)',
    end_work_desc: 'सेल्फी लेकर ड्यूटी पूरी करें',
    day_completed: 'आज का काम पूरा हुआ',
    day_completed_desc: 'आज की शिफ्ट सफलतापूर्वक समाप्त हुई',
    take_work_photo: 'काम का फोटो लें (TAKE PHOTO)',
    take_work_photo_desc: 'काम से पहले / प्रगति / समाप्ति फोटो',
    attendance_success: 'हाजिरी सफलतापूर्वक दर्ज हुई',
    photo_saved_success: 'फोटो सफलतापूर्वक सहेज ली गई',
    ask_leader_help: 'टीम लीडर से सहायता मांगें',

    photo_cat_before: 'काम से पहले',
    photo_cat_during: 'काम चालू है',
    photo_cat_after: 'काम पूरा हुआ',

    status_new: 'नया काम',
    status_ready: 'शुरू करने के लिए तैयार',
    status_working: 'काम चालू है',
    status_completed: 'पूरा हुआ',
    view_location: 'स्थान देखें',
    open_maps: 'गूगल मैप में रास्ता देखें',
    mark_complete: 'काम पूरा घोषित करें',

    check_in: 'आने का समय (चेक-इन)',
    check_out: 'जाने का समय (चेक-आउट)',
    total_hours: 'कुल घंटे',
    status_present: 'उपस्थित (Present)',
    status_absent: 'अनुपस्थित (Absent)',
    status_late: 'देरी से आए (Late)',
    status_leave: 'छुट्टी (Leave)',

    my_profile: 'मेरी प्रोफाइल',
    language_select: 'भाषा चुनें (Language)',
    logout: 'लॉग आउट',

    leader_home: 'होम',
    leader_my_team: 'मेरी टीम',
    leader_assign_work: 'काम सौंपें',
    leader_attendance: 'हाजिरी लें',
    leader_profile: 'प्रोफाइल',
    leader_evidence: 'काम की फोटो',

    summary_total_workers: 'कुल कामगार',
    summary_present: 'आज उपस्थित',
    summary_absent: 'अनुपस्थित',
    summary_not_checked_in: 'हाजिरी नहीं लगाई',

    btn_add_worker: '+ नया कामगार जोड़ें',
    btn_assign_work: 'काम सौंपें (ASSIGN)',
    btn_take_attendance: 'हाजिरी लें (ATTENDANCE)',
    btn_view_team: 'पूरी टीम देखें',

    worker_added_success: 'कामगार सफलतापूर्वक जुड़ गया',
    full_name: 'पूरा नाम',
    worker_role: 'काम का प्रकार / पेशा',
    action_view: 'देखें',
    action_edit: 'बदलें',
    action_remove: 'हटाएं',

    step1_title: 'चरण 1: क्या काम है?',
    step2_title: 'चरण 2: कौन काम करेगा?',
    step3_title: 'चरण 3: कहाँ और कब?',
    choice_individual: 'चुनिंदा कामगार',
    choice_team: 'पूरी टीम',
    select_location: 'कार्य स्थल चुनें',
    select_date: 'तारीख चुनें',
    btn_assign_confirm: 'काम पक्का करें',
  },

  bn: {
    app_name: 'WorkCrew (ওয়ার্কক্রু)',
    loading: 'লোড হচ্ছে...',
    cancel: 'বাতিল',
    save: 'সংরক্ষণ',
    confirm: 'নিশ্চিত করুন',
    success: 'সফল',
    error: 'ত্রুটি',
    close: 'বন্ধ করুন',
    view_details: 'বিস্তারিত দেখুন',
    phone: 'মোবাইল নম্বর',
    optional: 'ঐচ্ছিক',

    nav_home: 'হোম',
    nav_my_work: 'আমার কাজ',
    nav_attendance: 'হাজিরা',
    nav_profile: 'প্রোফাইল',

    greeting_morning: 'শুভ সকাল',
    greeting_afternoon: 'শুভ দুপুর',
    greeting_evening: 'শুভ সন্ধ্যা',
    worker_id_label: 'কর্মী আইডি',
    todays_work: 'আজকের কাজ',
    assigned_location: 'কাজের স্থান',
    team_leader: 'টিম লিডার',
    work_time: 'কাজের সময়',
    no_work_today: 'আজকের জন্য কোন কাজ নির্ধারিত নেই।',

    start_work: 'কাজ শুরু করুন (START WORK)',
    start_work_desc: 'সেলফি তুলে হাজিরা শুরু করুন',
    work_started: 'কাজ শুরু হয়েছে',
    work_started_desc: 'চেক-ইন সময়:',
    end_work: 'কাজ শেষ করুন (END WORK)',
    end_work_desc: 'সেলফি তুলে আজকের কাজ শেষ করুন',
    day_completed: 'আজকের কাজ সমাপ্ত',
    day_completed_desc: 'আজকের শিফট সম্পন্ন হয়েছে',
    take_work_photo: 'কাজের ছবি তুলুন (TAKE PHOTO)',
    take_work_photo_desc: 'কাজের শুরুর / চলমান / সমাপ্তির ছবি',
    attendance_success: 'হাজিরা সফলভাবে জমা হয়েছে',
    photo_saved_success: 'ছবি সফলভাবে সংরক্ষিত হয়েছে',
    ask_leader_help: 'টিম লিডারের সাহায্য নিন',

    photo_cat_before: 'কাজের পূর্বে',
    photo_cat_during: 'কাজ চলমান',
    photo_cat_after: 'কাজ সমাপ্ত',

    status_new: 'নতুন কাজ',
    status_ready: 'শুরু করতে প্রস্তুত',
    status_working: 'কাজ চলছে',
    status_completed: 'সম্পন্ন',
    view_location: 'কাজের স্থান দেখুন',
    open_maps: 'গুগল ম্যাপে দিকনির্দেশনা দেখুন',
    mark_complete: 'কাজ সমাপ্ত ঘোষণা করুন',

    check_in: 'আসার সময়',
    check_out: 'যাওয়ার সময়',
    total_hours: 'মোট ঘণ্টা',
    status_present: 'উপস্থিত (Present)',
    status_absent: 'অনুপস্থিত (Absent)',
    status_late: 'দেরি হয়েছে (Late)',
    status_leave: 'ছুটি (Leave)',

    my_profile: 'আমার প্রোফাইল',
    language_select: 'ভাষা পরিবর্তন (Language)',
    logout: 'লগ আউট',

    leader_home: 'হোম',
    leader_my_team: 'আমার দল',
    leader_assign_work: 'কাজ দিন',
    leader_attendance: 'হাজিরা নিন',
    leader_profile: 'প্রোফাইল',
    leader_evidence: 'কাজের ছবি',

    summary_total_workers: 'মোট কর্মী',
    summary_present: 'আজ উপস্থিত',
    summary_absent: 'অনুপস্থিত',
    summary_not_checked_in: 'হাজিরা দেয়নি',

    btn_add_worker: '+ নতুন কর্মী যোগ করুন',
    btn_assign_work: 'কাজ বরাদ্দ করুন',
    btn_take_attendance: 'হাজিরা নিন',
    btn_view_team: 'সম্পূর্ণ দল দেখুন',

    worker_added_success: 'কর্মী সফলভাবে যুক্ত হয়েছে',
    full_name: 'সম্পূর্ণ নাম',
    worker_role: 'কাজের ধরন',
    action_view: 'দেখুন',
    action_edit: 'সম্পাদনা',
    action_remove: 'মুছুন',

    step1_title: 'ধাপ ১: কী কাজ করতে হবে?',
    step2_title: 'ধাপ ২: কে কাজ করবে?',
    step3_title: 'ধাপ ৩: কোথায় এবং কখন?',
    choice_individual: 'নির্দিষ্ট কর্মীরা',
    choice_team: 'সম্পূর্ণ দল',
    select_location: 'কাজের স্থান নির্বাচন করুন',
    select_date: 'তারিখ নির্বাচন করুন',
    btn_assign_confirm: 'কাজ নিশ্চিত করুন',
  },
};
