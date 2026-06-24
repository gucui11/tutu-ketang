import type { Grade } from './questionBank';

export interface Teacher {
  id: string;
  name: string;
  nickname: string;
  title: string;
  grade: Grade;
  years: number;
  avatar: string;
  photoUrl: string;
  bio: string;
  specialties: string[];
  motto: string;
  avatarBg: string;
}

export const teachers: Record<Grade, Teacher> = {
  1: {
    id: 't1',
    name: '祁朋乐',
    nickname: '乐乐老师',
    title: '一年级主讲老师',
    grade: 1,
    years: 10,
    avatar: '祁',
    photoUrl: '/images/teachers/grade1.jpg',
    avatarBg: 'bg-gradient-to-br from-rose-400 to-pink-500',
    bio: '小学语文资深主讲老师，硕士研究生保送北京师范大学教育学专业，曾任教于南开大学汉语言文化学院，国家优秀汉语教师，外派休斯顿教授美国小学生中文，曾任茅盾征文大赛评委。10年教学经验，累计教授学员60W+。',
    specialties: ['拼音启蒙', '识字写字', '阅读兴趣培养'],
    motto: '用爱心和耐心，呵护每一颗小苗的成长。',
  },
  2: {
    id: 't2',
    name: '张莹菁',
    nickname: '阿静老师',
    title: '小学语文资深主讲老师',
    grade: 2,
    years: 8,
    avatar: '张',
    photoUrl: '/images/teachers/grade2.jpg',
    avatarBg: 'bg-gradient-to-br from-orange-400 to-amber-500',
    bio: '武汉大学学士，国家国学拔尖人才培养计划入选；荷兰莱顿大学文学硕士；国家公派留学联合培养博士入选。历年教师功底测状元，荣获"最强主讲""最佳魅力教师"等多项荣誉。阿静老师精心设计每一堂课，让孩子在接触语文之初便能感知语文之美，习得读写能力的门道。',
    specialties: ['词语积累', '句子训练', '阅读启蒙'],
    motto: '让孩子不仅提升成绩，更能培养受益终身的思维与能力。',
  },
  3: {
    id: 't3',
    name: '王勒',
    nickname: '水壶老师',
    title: '三年级主讲老师',
    grade: 3,
    years: 17,
    avatar: '王',
    photoUrl: '/images/teachers/grade3.jpg',
    avatarBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    bio: '小学语文资深主讲老师，北京师范大学本科毕业，17年教学经验，历任小学语文师训负责人、教研负责人。深耕小学中段语文教学，善于把握三年级这个阅读与写作的关键转折期。',
    specialties: ['阅读理解', '写作入门', '成语教学'],
    motto: '读书破万卷，下笔如有神。',
  },
  4: {
    id: 't4',
    name: '解书丹',
    nickname: '螃蟹老师',
    title: '四年级主讲老师',
    grade: 4,
    years: 11,
    avatar: '解',
    photoUrl: '/images/teachers/grade4.jpg',
    avatarBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    bio: '小学语文资深主讲老师，语文高考单科状元，国家专业人才库认证：高级家庭教育指导师、心理咨询师。11年一线教学经验，学员累计17万+，获得"S级最佳教师奖""教学先锋奖""杰出教学奖"等多项荣誉。',
    specialties: ['修辞手法', '作文指导', '语文思维训练'],
    motto: '语文是生活，是艺术，更是一种思维。',
  },
  5: {
    id: 't5',
    name: '韩笑笑',
    nickname: '笑笑老师',
    title: '五年级主讲老师',
    grade: 5,
    years: 9,
    avatar: '韩',
    photoUrl: '/images/teachers/grade5.jpg',
    avatarBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    bio: '小学语文资深主讲老师，武汉大学中文系科班出身，途途课堂小学语文骨干教师，深受学生家长信赖。9年线上线下教学经验，累计教授学员60W+，曾获"十佳教师""最受欢迎教师""教学之星"等多项荣誉。',
    specialties: ['议论文写作', '名著鉴赏', '小升初衔接'],
    motto: '授人以鱼，不如授人以渔。',
  },
  6: {
    id: 't6',
    name: '杨蕴天',
    nickname: '天天老师',
    title: '六年级主讲老师',
    grade: 6,
    years: 8,
    avatar: '杨',
    photoUrl: '/images/teachers/grade6.jpg',
    avatarBg: 'bg-gradient-to-br from-violet-400 to-purple-500',
    bio: '初中语文资深主讲老师，毕业于南开大学中文系，8年语文教研教学经验，荣获"最具魅力""出类拔萃""中流砥柱"等多类奖项，累计学员超百万。专注小升初衔接，帮学生搭建完整语文知识体系。',
    specialties: ['小升初冲刺', '综合复习', '写作提分', '面试指导'],
    motto: '六年磨一剑，为未来打下最坚实的语文基础。',
  },
};
