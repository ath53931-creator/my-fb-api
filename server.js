const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// التوكن الجديد الخاص بصفحتك
const PAGE_TOKEN = 'EAAL9mRSuO2UBQ5kNra0n7cZAFz4kvY4NOZASRqS2Jx9MIsm6deYLDjUmZCwTfZBMVyqN34mRINIlLXB5rgfA03lWtOw2W45fH20ZAOSTK7MARCElWTqYYZBpj7UESsQZBvBsHSJWEJzRsgnzCJMrc5FhsQQ56v58TJYmmkyAZC3dqxaHToTc7fOruG3ZBMc5iyjKSdN0FnGJt';

// وظيفة لاستخراج المعرف الرقمي للمنشور
function extractPostId(url) {
    try {
        if (!url.includes('facebook.com')) return url.trim();
        const regex = /(?:\/posts\/|(?:\?|&)fbid=|(?:\?|&)story_fbid=|(?:\?|&)id=|\/photos\/|\/videos\/|\/v\/)([0-9]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (e) { return null; }
}

app.post('/get-comments', async (req, res) => {
    const { postUrl } = req.body;
    const postId = extractPostId(postUrl);

    if (!postId) {
        return res.status(400).json({ success: false, error: 'لم نتمكن من تحديد رقم المنشور' });
    }

    try {
        // نطلب حقل الـ from للحصول على الأسماء وحقل message كاحتياط
        const fbApiUrl = `https://graph.facebook.com/v21.0/${postId}/comments?access_token=${PAGE_TOKEN}&limit=5000&fields=from,message`;
        
        const response = await axios.get(fbApiUrl);
        const comments = response.data.data;

        if (!comments || comments.length === 0) {
            return res.json({ success: true, participants: [], message: 'لا توجد تعليقات حتى الآن.' });
        }

        // استخراج الأسماء (بما أنك مدير الصفحة، سيظهر الاسم الصريح)
        const participants = comments.map(c => {
            if (c.from && c.from.name) {
                return c.from.name;
            } else if (c.message) {
                return "مشارك (نص تعليقه: " + c.message.substring(0, 15) + "...)";
            }
            return "مشارك مخفي الهوية";
        });

        // حذف التكرار (كل شخص يدخل القرعة مرة واحدة مهما كرر التعليق)
        const uniqueParticipants = [...new Set(participants)];

        res.json({
            success: true,
            total: uniqueParticipants.length,
            participants: uniqueParticipants
        });

    } catch (error) {
        const errorDetail = error.response ? error.response.data.error.message : error.message;
        console.error("Facebook API Error:", errorDetail);
        res.status(500).json({ success: false, error: "خطأ من فيسبوك: " + errorDetail });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
