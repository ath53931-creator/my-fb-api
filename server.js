const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PAGE_TOKEN = 'EAAL9mRSuO2UBQ5kNra0n7cZAFz4kvY4NOZASRqS2Jx9MIsm6deYLDjUmZCwTfZBMVyqN34mRINIlLXB5rgfA03lWtOw2W45fH20ZAOSTK7MARCElWTqYYZBpj7UESsQZBvBsHSJWEJzRsgnzCJMrc5FhsQQ56v58TJYmmkyAZC3dqxaHToTc7fOruG3ZBMc5iyjKSdN0FnGJt';

function extractPostId(url) {
    try {
        const regex = /([0-9]{10,20})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (e) { return null; }
}

app.post('/get-comments', async (req, res) => {
    const { postUrl } = req.body;
    const postId = extractPostId(postUrl);

    if (!postId) return res.status(400).json({ success: false, error: 'الرابط غير صحيح' });

    try {
        // حذفنا حقل "from" تماماً لأنه هو سبب المشكلة (Error 12)
        // سنكتفي بسحب نص التعليق (message) ومعرف فريد لكل تعليق (id)
        const fbUrl = `https://graph.facebook.com/v21.0/${postId}/comments?access_token=${PAGE_TOKEN}&limit=5000&fields=message,id`;
        
        const response = await axios.get(fbUrl);
        const comments = response.data.data;

        if (!comments || comments.length === 0) {
            return res.json({ success: true, participants: [] });
        }

        // تحويل التعليقات إلى قائمة مشاركين بناءً على نص التعليق
        const participants = comments.map(c => c.message || "تعليق بدون نص");

        res.json({ 
            success: true, 
            participants: participants,
            total: participants.length 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: "خطأ: فيسبوك يمنع الوصول لأسماء المعلقين حالياً. سنحاول سحب التعليقات فقط." 
        });
    }
});

app.listen(process.env.PORT || 3000);
