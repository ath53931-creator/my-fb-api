const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const FB_TOKEN = 'EAAL9mRSuO2UBQZCgAObR1atU49x280heRhajW7P4BhSyJDtCGwIK6qPopHqsjjG2Wclt0XcNxvAWhvTf8lZBMKFXq1CxplFgeVvwUbZCKKZA7S8i1VHUOsXaxiLgR0Hwe4iZAh5epJYBBJWBAFcT5DG1KgtqNjryc1lNJha4nSiW7vQ3zfhA91sZBpBe0ETmH8fNeIZCvJAqVJYCejZABihyGoWnI43zj0whqmsUC5k3RZBx2rtHbZCIvGfQZDZD';

app.post('/get-comments', async (req, res) => {
    const { postUrl } = req.body;
    try {
        const match = postUrl.match(/(?:posts|videos|photos|fbid)\/([0-9]+)/) || postUrl.match(/story_fbid=([0-9]+)/);
        const postId = match ? match[1] : null;
        if (!postId) throw new Error('ID المنشور غير صحيح');

        const fbUrl = `https://graph.facebook.com/v18.0/${postId}/comments?access_token=${FB_TOKEN}&limit=1000&fields=from,message`;
        const response = await axios.get(fbUrl);
        const names = response.data.data.map(c => c.from.name);
        res.json({ success: true, participants: [...new Set(names)] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(process.env.PORT || 3000);
