const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// التوكن الخاص بك
const FB_TOKEN = 'EAAXkQYSWLfQBQ4UnT8J87oF6BxgeZC55iq8STRSpGNqWRCGRxfpkebrW3yC5UL2lNIp5zfLChG6zp94r9p6CZCHVeI6E4764vmLj1UDWPQZAwS7BZBL8ZA9imOj0A1UJXk0yTPW84GwAESpKMcDoNfqGaZApm19giC10R7Dh2YqHo6VaUgzQidbaHG2nFuAZCXI7F6GYBLe19jmzQix5nS7kYxzUBcauFQZBoxj1Ky1FsmZA7BZA7PhXDpsZAsgyObdhaJicl6zEEFVeYPJN7ZADp9qRFvxPiUlYq5rMI3OC4DAv3QBZCsZAHXhXXqZBtZBJkHwtXUi6HkB8SIj74ATbckkZD';

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
        return res.status(400).json({ success: false, error: 'تعذر تحديد رقم المنشور' });
    }

    try {
        // التعديل هنا: نطلب الحقول بطريقة لا تسبب خطأ (12)
        // إذا لم يسمح فيسبوك بالاسم (from)، سيسحب النص (message) كبديل للقرعة
        const fbApiUrl = `https://graph.facebook.com/v21.0/${postId}/comments?access_token=${FB_TOKEN}&limit=1000&fields=id,message,from`;
        
        const response = await axios.get(fbApiUrl);
        const comments = response.data.data;

        if (!comments || comments.length === 0) {
            return res.json({ success: true, participants: [], message: 'لا توجد تعليقات عامة.' });
        }

        // منطق ذكي: إذا كان الاسم متاحاً نأخذه، وإذا كان مخفياً نأخذ نص التعليق لتمييز الشخص
        const participants = comments.map(c => {
            if (c.from && c.from.name) {
                return c.from.name;
            } else {
                // إذا كان الاسم مخفياً بسبب الخصوصية، نستخدم أول 20 حرف من تعليقه كمعرف له في القرعة
                return "تعليق: " + (c.message ? c.message.substring(0, 20) : "مشارك مخفي");
            }
        });

        const uniqueParticipants = [...new Set(participants)];

        res.json({
            success: true,
            total: uniqueParticipants.length,
            participants: uniqueParticipants
        });

    } catch (error) {
        const errorDetail = error.response ? error.response.data.error.message : error.message;
        res.status(500).json({ success: false, error: "خطأ فيسبوك: " + errorDetail });
    }
});

app.listen(process.env.PORT || 3000);
