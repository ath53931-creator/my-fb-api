const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// التوكن الجديد الخاص بك (مدمج وجاهز)
const FB_TOKEN = 'EAAXkQYSWLfQBQ4UnT8J87oF6BxgeZC55iq8STRSpGNqWRCGRxfpkebrW3yC5UL2lNIp5zfLChG6zp94r9p6CZCHVeI6E4764vmLj1UDWPQZAwS7BZBL8ZA9imOj0A1UJXk0yTPW84GwAESpKMcDoNfqGaZApm19giC10R7Dh2YqHo6VaUgzQidbaHG2nFuAZCXI7F6GYBLe19jmzQix5nS7kYxzUBcauFQZBoxj1Ky1FsmZA7BZA7PhXDpsZAsgyObdhaJicl6zEEFVeYPJN7ZADp9qRFvxPiUlYq5rMI3OC4DAv3QBZCsZAHXhXXqZBtZBJkHwtXUi6HkB8SIj74ATbckkZD';

// وظيفة احترافية لاستخراج معرف المنشور بدقة
function extractPostId(url) {
    try {
        if (!url.includes('facebook.com')) return url.trim(); // إذا كان المدخل رقماً فقط
        
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        // البحث عن المعرف في روابط الصور أو الفيديوهات أو المنشورات المباشرة
        let id = params.get('fbid') || params.get('story_fbid') || params.get('id');
        if (id) return id;

        const segments = urlObj.pathname.split('/').filter(s => s.length > 0);
        // استخراج أطول سلسلة أرقام في المسار
        const numericSegments = segments.filter(s => /^\d+$/.test(s));
        return numericSegments.length > 0 ? numericSegments[numericSegments.length - 1] : segments[segments.length - 1];
    } catch (e) {
        return null;
    }
}

app.post('/get-comments', async (req, res) => {
    const { postUrl } = req.body;
    const postId = extractPostId(postUrl);

    if (!postId) {
        return res.status(400).json({ success: false, error: 'تعذر استخراج معرف المنشور' });
    }

    try {
        // استخدام Graph API لجلب التعليقات (v21.0 هي الأحدث والأكثر استقراراً)
        const fbApiUrl = `https://graph.facebook.com/v21.0/${postId}/comments?access_token=${FB_TOKEN}&limit=2000&fields=from,message`;
        
        const response = await axios.get(fbApiUrl);
        const comments = response.data.data;

        if (!comments || comments.length === 0) {
            return res.json({ success: true, participants: [], message: 'لا توجد تعليقات عامة متاحة.' });
        }

        // تصفية الأسماء المكررة
        const names = comments.map(c => c.from ? c.from.name : 'مشارك فيسبوك');
        const uniqueNames = [...new Set(names)];

        res.json({
            success: true,
            total: uniqueNames.length,
            participants: uniqueNames
        });

    } catch (error) {
        const errorDetail = error.response ? error.response.data.error.message : error.message;
        console.error("FB Error:", errorDetail);
        res.status(500).json({ success: false, error: errorDetail });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
