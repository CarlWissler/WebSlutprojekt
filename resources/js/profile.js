const editForm = document.querySelector('.edit-profile-form')
const confirmDelete = document.querySelector('.confirm-delete')
const profileTitel = document.querySelector('.profile-titel')


function showStepOne() {
    editForm.style.display = 'block';
    confirmDelete.style.display = 'none';
    editForm.animate([
        {opacity: '0', transform: 'translateY(50px)'},
        {opacity: '0.3', transform: 'translateY(20px)'},
        {opacity: '0.6', transform: 'translateY(10px)'},
        {opacity: '1', transform: 'translateY(0px)'}
    ], {
        duration: 1000,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
}






function showStepTwo() {
    editForm.style.display = 'none';
    confirmDelete.style.display = 'block';
    confirmDelete.animate([
        {opacity: '0', transform: 'translateY(50px)'},
        {opacity: '1', transform: 'translateY(0px)'}
    ], {
        duration: 1000,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
}

function backHome() {
    window.location.href = "/home-feed";
}

function followPage() {
    window.location.href = "/follow";
}

editForm.animate([
    {opacity: '0', transform: 'translateY(100px)'},
    {opacity: '1', transform: 'translateY(0px)'}
], {
    duration: 1000,
    easing: 'ease-in-out'
});


// animation for profile box when page loads
const profileBox = document.querySelector(".profile-box");
profileBox.style.opacity = 0;

window.addEventListener("load", () => {
    profileBox.style.transition = "opacity 1s";
    profileBox.style.opacity = 1;
});


showStepOne();
