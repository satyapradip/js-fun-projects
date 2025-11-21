var arr = [
    {dp:"https://content.tupaki.com/tupaki/feeds/2024/09/06/507775-6jwbkx1n.gif",story:"https://d2e1hu1ktur9ur.cloudfront.net/wp-content/uploads/2023/02/Ayesha-Khan-2-1.jpg"},
    {dp:"https://i.pinimg.com/originals/9a/5b/ba/9a5bba37cefdd2e27cae37bc59576f49.jpg",story:"https://i.pinimg.com/474x/c3/54/d2/c354d2565f34c4fd0f02accb70c795a9.jpg"},
    {dp:"https://c4.wallpaperflare.com/wallpaper/769/60/939/tamanna-bhatia-actress-model-dancer-wallpaper-preview.jpg",story:"https://mir-s3-cdn-cf.behance.net/projects/404/624682227105553.Y3JvcCw3NjgyLDYwMDgsMCw2NDY.jpg"},
    {dp:"https://wallpapersok.com/images/thumbnail/heroine-anupama-parameswaran-g2moadxjn0xn1tph.webp",story:"https://wallpapercave.com/wp/wp5287721.jpg"},
    {dp:"https://i.pinimg.com/originals/db/f1/69/dbf16922f3ad95994263411d086e7378.jpg",story:"https://i.pinimg.com/736x/cf/0d/03/cf0d03cbad45245c2f6010724de50c02.jpg"},
    {dp:"https://teluguone.com/photos/uploadsExt/uploads/Kavya%20Thapar/Kavya%20Thapar%20Latest%20Pics/Kavya%20Thapasr%20Latest%20Pictures.webp",story:"https://content.tupaki.com/h-upload/2025/05/17/807640-ouraqlrc.webp"}

];

var storiyan = document.querySelector('#storiyan');
var clutter = "";
arr.forEach(function(elem,idx) {
    clutter += `<div class="story">
                <img id="${idx}" src="${elem.dp}" alt="">
            </div>`;
})

storiyan.innerHTML = clutter;

storiyan.addEventListener('click', function(dets) {
    // arr[dets.target.id].story
    document.querySelector('#full-screen').style.display = "block";
    document.querySelector("#full-screen").style.backgroundImage = `url(${arr[dets.target.id].story})`;

    setTimeout(function() {
        document.querySelector('#full-screen').style.display = "none";
    },3000)
})