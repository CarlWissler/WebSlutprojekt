function showStepOne() {
    document.querySelector('.sign-in-box-1').style.display = 'block';
    document.querySelector('.sign-in-box-2').style.display = 'none';
}

function showStepTwo() {
    document.querySelector('.sign-in-box-1').style.display = 'none';
    document.querySelector('.sign-in-box-2').style.display = 'block';
}

showStepOne();