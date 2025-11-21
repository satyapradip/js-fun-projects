var istatus = document.querySelector('h5');

var btn = document.querySelector('#add');
// var removeFriend = document.querySelector('#remove');

var check = 0;

btn.addEventListener('click', function() {
    if (check === 0) {
        istatus.innerHTML = "Friends";
        istatus.style.color = "cadetblue";
        btn.innerHTML = "Remove Friend";
        btn.style.backgroundColor = "red";
        check = 1;
    } else {
        istatus.innerHTML = "Stranger";
        istatus.style.color = "black";
        btn.innerHTML = "Add Friend";
        btn.style.backgroundColor = "cadetblue";
        check = 0;
    }
})
