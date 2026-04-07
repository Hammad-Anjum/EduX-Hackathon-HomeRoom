const translations: Record<string, Record<string, string>> = {
  en: {
    // Nav
    "app.name": "BridgeEd",
    "nav.dashboard": "Dashboard",
    "nav.new_update": "New Update",
    "nav.messages": "Messages",
    "nav.updates": "Updates",
    "nav.curriculum": "Ask About Curriculum",

    // Teacher Dashboard
    "dashboard.title": "Teacher Dashboard",
    "dashboard.new_update": "+ New Weekly Update",
    "dashboard.empty": "No updates yet. Create your first weekly update!",
    "dashboard.notes": "Notes:",
    "dashboard.view_insights": "View Parent Insights →",

    // Compose
    "compose.title": "Compose Weekly Update",
    "compose.your_notes": "Your Notes",
    "compose.notes_help": "Write a few sentences about what was covered this week. AI will generate a parent-friendly version.",
    "compose.placeholder": "e.g., Maths: started fractions this week. Reading: finished Charlotte's Web.",
    "compose.generating": "Generating...",
    "compose.generate": "Generate Update",
    "compose.preview": "Preview",
    "compose.content_label": "Content for parents:",
    "compose.activities_label": "Home activities:",
    "compose.prompts_label": "Guided prompts for parents:",
    "compose.sending": "Sending...",
    "compose.send": "Send to Parents",
    "compose.regenerate": "Regenerate",

    // Insights
    "insights.title": "Parent Response Insights",
    "insights.responses": "Responses",
    "insights.rate": "Response Rate",
    "insights.themes_count": "Themes",
    "insights.sentiment": "Sentiment",
    "insights.summary": "Summary",
    "insights.common_themes": "Common Themes",
    "insights.loading": "Loading insights...",
    "insights.none": "No insights available.",

    // Messages
    "messages.conversations": "Conversations",
    "messages.new_chat": "Start new chat:",
    "messages.no_contacts": "No new contacts",
    "messages.empty": "No conversations yet. Click + to start one.",
    "messages.select": "Select a conversation or click + to start a new one",
    "messages.connected": "Connected",
    "messages.disconnected": "Disconnected",
    "messages.placeholder": "Type a message...",
    "messages.send": "Send",

    // Feed
    "feed.title": "Weekly Updates",
    "feed.empty": "No updates from your child's teacher yet.",
    "feed.activities": "Things to try at home:",
    "feed.prompts": "Your teacher would like to know:",
    "feed.respond": "Respond →",

    // Respond
    "respond.title": "Respond to Teacher",
    "respond.sent": "Response Sent!",
    "respond.sent_desc": "Your teacher will see your feedback.",
    "respond.back": "Back to Updates",
    "respond.placeholder": "Write your response here... You can write in any language.",
    "respond.sending": "Sending...",
    "respond.send": "Send Response",
    "respond.cancel": "Cancel",

    // Curriculum
    "curriculum.title": "Ask About the Curriculum",
    "curriculum.subtitle": "Ask any question about what your child is learning, NAPLAN, report cards, or the Australian school system.",
    "curriculum.placeholder": "e.g., What should my child know in maths by Year 3?",
    "curriculum.thinking": "Thinking...",
    "curriculum.ask": "Ask",
    "curriculum.any_year": "Any year level",
    "curriculum.any_subject": "Any subject",
    "curriculum.suggested": "Suggested questions:",
    "curriculum.answer": "Answer",
    "curriculum.sources": "Sources:",

    // Meeting
    "meeting.title": "Meeting Room",
    "meeting.connecting": "Connecting...",
    "meeting.stop_mic": "Stop Microphone",
    "meeting.start_mic": "Start Microphone",
    "meeting.listening": "Listening... Speak clearly.",
    "meeting.live": "Live Translation",
    "meeting.subtitle_empty": "Subtitles will appear here when the other person speaks...",

    // Translate
    "translate.failed": "Translation failed.",
    "translate.loading": "Translating...",
    "translate.hide": "Hide translation",
    "translate.show": "Translate",
    "translate.page": "Translate Page",

    // Chat (parent)
    "chat.title": "Chat with Teacher",
    "chat.placeholder": "Write in any language...",

    // Student Progress
    "nav.students": "Students",
    "nav.progress": "Progress",
    "students.title": "Students",
    "students.search": "Search students...",
    "student.detail": "Student Detail",
    "student.achievements": "Achievement Standards",
    "student.skills": "Skills",
    "student.assignments": "Assignments",
    "student.save": "Save",
    "student.saved": "Saved!",
    "student.add_assignment": "New Assignment",
    "progress.title": "Your Child's Progress",
    "progress.achievement": "Achievement Levels",
    "progress.growth": "Growth Over Time",
    "progress.skills": "Skill Mastery",
    "progress.score_label": "Your child's score",
    "progress.no_data": "No progress data yet.",

    // Common
    "common.draft": "draft",
    "common.sent": "sent",
  },

  zh: {
    // Nav
    "app.name": "BridgeEd",
    "nav.dashboard": "仪表板",
    "nav.new_update": "新更新",
    "nav.messages": "消息",
    "nav.updates": "每周更新",
    "nav.curriculum": "询问课程",

    // Teacher Dashboard
    "dashboard.title": "教师仪表板",
    "dashboard.new_update": "+ 新的每周更新",
    "dashboard.empty": "还没有更新。创建您的第一个每周更新！",
    "dashboard.notes": "备注：",
    "dashboard.view_insights": "查看家长反馈 →",

    // Compose
    "compose.title": "撰写每周更新",
    "compose.your_notes": "您的备注",
    "compose.notes_help": "写几句关于本周学习内容的话。AI将生成适合家长阅读的版本。",
    "compose.placeholder": "例如：数学：本周开始学分数。阅读：读完了《夏洛的网》。",
    "compose.generating": "生成中...",
    "compose.generate": "生成更新",
    "compose.preview": "预览",
    "compose.content_label": "给家长的内容：",
    "compose.activities_label": "家庭活动：",
    "compose.prompts_label": "给家长的引导问题：",
    "compose.sending": "发送中...",
    "compose.send": "发送给家长",
    "compose.regenerate": "重新生成",

    // Insights
    "insights.title": "家长反馈洞察",
    "insights.responses": "回复数",
    "insights.rate": "回复率",
    "insights.themes_count": "主题",
    "insights.sentiment": "情感分析",
    "insights.summary": "摘要",
    "insights.common_themes": "常见主题",
    "insights.loading": "加载洞察中...",
    "insights.none": "暂无洞察。",

    // Messages
    "messages.conversations": "对话",
    "messages.new_chat": "开始新对话：",
    "messages.no_contacts": "没有新联系人",
    "messages.empty": "还没有对话。点击 + 开始一个。",
    "messages.select": "选择一个对话或点击 + 开始新对话",
    "messages.connected": "已连接",
    "messages.disconnected": "已断开",
    "messages.placeholder": "输入消息...",
    "messages.send": "发送",

    // Feed
    "feed.title": "每周更新",
    "feed.empty": "还没有来自孩子老师的更新。",
    "feed.activities": "在家可以尝试的事情：",
    "feed.prompts": "老师想了解：",
    "feed.respond": "回复 →",

    // Respond
    "respond.title": "回复老师",
    "respond.sent": "回复已发送！",
    "respond.sent_desc": "您的老师会看到您的反馈。",
    "respond.back": "返回更新",
    "respond.placeholder": "在此写下您的回复...您可以用任何语言书写。",
    "respond.sending": "发送中...",
    "respond.send": "发送回复",
    "respond.cancel": "取消",

    // Curriculum
    "curriculum.title": "询问课程内容",
    "curriculum.subtitle": "询问任何关于孩子学习内容、NAPLAN、成绩单或澳大利亚学校系统的问题。",
    "curriculum.placeholder": "例如：我的孩子在三年级应该掌握哪些数学知识？",
    "curriculum.thinking": "思考中...",
    "curriculum.ask": "提问",
    "curriculum.any_year": "任意年级",
    "curriculum.any_subject": "任意科目",
    "curriculum.suggested": "推荐问题：",
    "curriculum.answer": "回答",
    "curriculum.sources": "来源：",

    // Meeting
    "meeting.title": "会议室",
    "meeting.connecting": "连接中...",
    "meeting.stop_mic": "关闭麦克风",
    "meeting.start_mic": "开启麦克风",
    "meeting.listening": "正在收听...请清晰说话。",
    "meeting.live": "实时翻译",
    "meeting.subtitle_empty": "当对方说话时，字幕将在此显示...",

    // Translate
    "translate.failed": "翻译失败。",
    "translate.loading": "翻译中...",
    "translate.hide": "隐藏翻译",
    "translate.show": "翻译",
    "translate.page": "翻译页面",

    // Chat (parent)
    "chat.title": "与老师聊天",
    "chat.placeholder": "用任何语言书写...",

    // Common
    // Student Progress
    "nav.students": "学生",
    "nav.progress": "学习进度",
    "students.title": "学生",
    "students.search": "搜索学生...",
    "student.detail": "学生详情",
    "student.achievements": "达标水平",
    "student.skills": "技能",
    "student.assignments": "作业",
    "student.save": "保存",
    "student.saved": "已保存！",
    "student.add_assignment": "新作业",
    "progress.title": "您孩子的进度",
    "progress.achievement": "达标水平",
    "progress.growth": "成长轨迹",
    "progress.skills": "技能掌握",
    "progress.score_label": "您孩子的分数",
    "progress.no_data": "暂无进度数据。",

    "common.draft": "草稿",
    "common.sent": "已发送",
  },

  ar: {
    // Nav
    "app.name": "BridgeEd",
    "nav.dashboard": "لوحة التحكم",
    "nav.new_update": "تحديث جديد",
    "nav.messages": "الرسائل",
    "nav.updates": "التحديثات الأسبوعية",
    "nav.curriculum": "اسأل عن المنهج",

    // Teacher Dashboard
    "dashboard.title": "لوحة تحكم المعلم",
    "dashboard.new_update": "+ تحديث أسبوعي جديد",
    "dashboard.empty": "لا توجد تحديثات بعد. أنشئ أول تحديث أسبوعي!",
    "dashboard.notes": "ملاحظات:",
    "dashboard.view_insights": "عرض ملاحظات أولياء الأمور ←",

    // Compose
    "compose.title": "كتابة التحديث الأسبوعي",
    "compose.your_notes": "ملاحظاتك",
    "compose.notes_help": "اكتب بضع جمل عما تم تغطيته هذا الأسبوع. سيقوم الذكاء الاصطناعي بإنشاء نسخة مناسبة لأولياء الأمور.",
    "compose.placeholder": "مثال: الرياضيات: بدأنا الكسور هذا الأسبوع. القراءة: أنهينا شبكة شارلوت.",
    "compose.generating": "جارٍ الإنشاء...",
    "compose.generate": "إنشاء التحديث",
    "compose.preview": "معاينة",
    "compose.content_label": "المحتوى لأولياء الأمور:",
    "compose.activities_label": "أنشطة منزلية:",
    "compose.prompts_label": "أسئلة موجهة لأولياء الأمور:",
    "compose.sending": "جارٍ الإرسال...",
    "compose.send": "إرسال لأولياء الأمور",
    "compose.regenerate": "إعادة الإنشاء",

    // Insights
    "insights.title": "ملاحظات ردود أولياء الأمور",
    "insights.responses": "الردود",
    "insights.rate": "معدل الاستجابة",
    "insights.themes_count": "المواضيع",
    "insights.sentiment": "تحليل المشاعر",
    "insights.summary": "الملخص",
    "insights.common_themes": "المواضيع الشائعة",
    "insights.loading": "جارٍ تحميل الملاحظات...",
    "insights.none": "لا تتوفر ملاحظات.",

    // Messages
    "messages.conversations": "المحادثات",
    "messages.new_chat": "بدء محادثة جديدة:",
    "messages.no_contacts": "لا توجد جهات اتصال جديدة",
    "messages.empty": "لا توجد محادثات بعد. انقر + لبدء واحدة.",
    "messages.select": "اختر محادثة أو انقر + لبدء محادثة جديدة",
    "messages.connected": "متصل",
    "messages.disconnected": "غير متصل",
    "messages.placeholder": "اكتب رسالة...",
    "messages.send": "إرسال",

    // Feed
    "feed.title": "التحديثات الأسبوعية",
    "feed.empty": "لا توجد تحديثات من معلم طفلك بعد.",
    "feed.activities": "أشياء يمكن تجربتها في المنزل:",
    "feed.prompts": "يود معلمك أن يعرف:",
    "feed.respond": "الرد ←",

    // Respond
    "respond.title": "الرد على المعلم",
    "respond.sent": "تم إرسال الرد!",
    "respond.sent_desc": "سيرى معلمك ملاحظاتك.",
    "respond.back": "العودة للتحديثات",
    "respond.placeholder": "اكتب ردك هنا... يمكنك الكتابة بأي لغة.",
    "respond.sending": "جارٍ الإرسال...",
    "respond.send": "إرسال الرد",
    "respond.cancel": "إلغاء",

    // Curriculum
    "curriculum.title": "اسأل عن المنهج الدراسي",
    "curriculum.subtitle": "اسأل أي سؤال عما يتعلمه طفلك، NAPLAN، بطاقات التقارير، أو نظام المدارس الأسترالي.",
    "curriculum.placeholder": "مثال: ماذا يجب أن يعرف طفلي في الرياضيات بحلول السنة الثالثة؟",
    "curriculum.thinking": "جارٍ التفكير...",
    "curriculum.ask": "اسأل",
    "curriculum.any_year": "أي مستوى سنة",
    "curriculum.any_subject": "أي مادة",
    "curriculum.suggested": "أسئلة مقترحة:",
    "curriculum.answer": "الإجابة",
    "curriculum.sources": "المصادر:",

    // Meeting
    "meeting.title": "غرفة الاجتماع",
    "meeting.connecting": "جارٍ الاتصال...",
    "meeting.stop_mic": "إيقاف الميكروفون",
    "meeting.start_mic": "تشغيل الميكروفون",
    "meeting.listening": "جارٍ الاستماع... تحدث بوضوح.",
    "meeting.live": "الترجمة المباشرة",
    "meeting.subtitle_empty": "ستظهر الترجمة هنا عندما يتحدث الشخص الآخر...",

    // Translate
    "translate.failed": "فشلت الترجمة.",
    "translate.loading": "جارٍ الترجمة...",
    "translate.hide": "إخفاء الترجمة",
    "translate.show": "ترجمة",
    "translate.page": "ترجمة الصفحة",

    // Chat (parent)
    "chat.title": "الدردشة مع المعلم",
    "chat.placeholder": "اكتب بأي لغة...",

    // Common
    // Student Progress
    "nav.students": "الطلاب",
    "nav.progress": "التقدم",
    "students.title": "الطلاب",
    "students.search": "البحث عن طالب...",
    "student.detail": "تفاصيل الطالب",
    "student.achievements": "مستويات التحصيل",
    "student.skills": "المهارات",
    "student.assignments": "الواجبات",
    "student.save": "حفظ",
    "student.saved": "تم الحفظ!",
    "student.add_assignment": "واجب جديد",
    "progress.title": "تقدم طفلك",
    "progress.achievement": "مستويات التحصيل",
    "progress.growth": "النمو بمرور الوقت",
    "progress.skills": "إتقان المهارات",
    "progress.score_label": "درجة طفلك",
    "progress.no_data": "لا توجد بيانات تقدم بعد.",

    "common.draft": "مسودة",
    "common.sent": "مُرسل",
  },
};

export default translations;
