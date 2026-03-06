const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// التوكن الخاص بك (دائم ومفعل)
const FB_TOKEN = 'EAAL9mRSuO2UBQZCgAObR1atU49x280heRhajW7P4BhSyJDtCGwIK6qPopHqsjjG2Wclt0XcNxvAWhvTf8lZBMKFXq1CxplFgeVvwUbZCKKZA7S8i1VHUOsXaxiLgR0Hwe4iZAh5epJYBBJWBAFcT5DG1KgtqNjryc1lNJha4nSiW7vQ3zfhA91sZBpBe0ETmH8fNeIZCvJAqVJYCejZABihyGoWnI43zj0whqmsUC5k3RZBx2rtHbZCIvGfQZDZD';

// وظيفة ذكية لاستخراج ID المنشور من الرابط
function extractPostId(url) {
    try {
        const urlObj = new URL(url);
        // 1. البحث في المعلمات (Parameters) مثل fbid أو story_fbid
        const params = new URLSearchParams(urlObj.search);
        let id = params.get('fbid') || params.get('story_fbid') || params.get('id');
        if (id) return id;

        // 2. البحث في مسار الرابط (Pathname) عن أرقام طويلة
        const segments = urlObj.pathname.split('/').filter(s => s.length > 0);
        // نبحث عن أول عنصر يتكون من أرقام فقط وطوله أكثر من 5 خانات
        const numericId = segments.find(s => /^\d+$/.test(s) && s.length > 5);
        if (numericId) return numericId;

        // 3. إذا كان الرابط ينتهي برقم مباشرة
        return segments[segments.length - 1];
    } catch (e) {
        return null;
    }
}

app.post('/get-comments', async (req, res) => {
    const { postUrl } = req.body;

    if (!postUrl) {
        return res.status(400).json({ success: false, error: 'يرجى إدخال رابط المنشور' });
    }

    const postId = extractPostId(postUrl);

    if (!postId) {
        return res.status(400).json({ success: false, error: 'لم نتمكن من العثور على ID المنشور. تأكد من صحة الرابط.' });
    }

    try {
        // الاتصال المباشر بـ Facebook Graph API
        const fbApiUrl = `https://graph.facebook.com/v18.0/${postId}/comments?access_token=${FB_TOKEN}&limit=1000&fields=from,message`;
        
        const response = await axios.get(fbApiUrl);
        const comments = response.data.data;

        if (!comments || comments.length === 0) {
            return res.json({ success: true, participants: [], message: 'لا توجد تعليقات على هذا المنشور.' });
        }

        // استخراج الأسماء وحذف التكرار
        const names = comments.map(c => c.from ? c.from.name : 'مستخدم فيسبوك');
        const uniqueNames = [...new Set(names)];

        res.json({
            success: true,
            total: uniqueNames.length,
            participants: uniqueNames
        });

    } catch (error) {
        console.error("FB Error:", error.response ? error.response.data : error.message);
        const errorMsg = error.response && error.response.data.error ? error.response.data.error.message : error.message;
        res.status(500).json({ success: false, error: errorMsg });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
