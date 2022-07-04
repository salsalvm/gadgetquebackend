function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
            }
            
        }
    })
}


// const imagebox1 = document.getElementById('image-box1')
//     const crop_btn1 = document.getElementById('crop-btn1')
//     const input1 = document.getElementById('id_image1')
//     function fileValidation1(event) {
//         console.log('yes');

//         var fileInput = document.getElementById('id_image1');

//         var filePath = fileInput.value;
//         var allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
//         if (!allowedExtensions.exec(filePath)) {
//             fileInput.value = '';
//             swal("There is a problem!", "Please choose image file.");
//             return false;
//         } else {
//             document.getElementById('imgView1').src = URL.createObjectURL(event.target.files[0])

//         }

//     }

//     input1.addEventListener('change', () => {

//         const img_data1 = input1.files[0]
//         const url1 = URL.createObjectURL(img_data1)
//         imagebox1.innerHTML = `<img src="${url1}" id="image1" style="width:100%;">`
//         const image1 = document.getElementById('image1')
//         document.getElementById('image-box1').style.display = 'block'
//         document.getElementById('crop-btn1').style.display = 'block'
//         const cropper1 = new Cropper(image1, {
//             autoCropArea: 1,
//             viewMode: 1,
//             scalable: false,
//             zoomable: false,
//             movable: false,
//             minCropBoxWidth: 50,
//             minCropBoxHeight: 50,
//         })
//         crop_btn1.addEventListener('click', () => {
//             cropper1.getCroppedCanvas().toBlob((blob) => {
//                 let fileInputElement1 = document.getElementById('id_image1');
//                 let file1 = new File([blob], img_data1.name, { type: "image/*", lastModified: new Date().getTime() });
//                 let container1 = new DataTransfer();
//                 container1.items.add(file1);
//                 fileInputElement1.files = container1.files;
//                 document.getElementById('imgView1').src = URL.createObjectURL(fileInputElement1.files[0])
//                 document.getElementById('image-box1').style.display = 'none'
//                 document.getElementById('crop-btn1').style.display = 'none'
//             })
//         })
//     })



//     const imagebox2 = document.getElementById('image-box1')
//     const crop_btn2 = document.getElementById('crop-btn1')
//     const input2 = document.getElementById('id_image2')
//     function fileValidation2(event) {


//         var fileInput = document.getElementById('id_image2');

//         var filePath = fileInput.value;
//         var allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
//         if (!allowedExtensions.exec(filePath)) {
//             fileInput.value = '';
//             swal("There is a problem!", "Please choose image file.");
//             return false;
//         } else {
//             document.getElementById('imgView2').src = URL.createObjectURL(event.target.files[0])

//         }

//     }

//     input2.addEventListener('change', () => {

//         const img_data1 = input2.files[0]
//         const url1 = URL.createObjectURL(img_data1)
//         imagebox2.innerHTML = `<img src="${url1}" id="image2" style="width:100%;">`
//         const image2 = document.getElementById('image2')
//         document.getElementById('image-box1').style.display = 'block'
//         document.getElementById('crop-btn1').style.display = 'block'
//         const cropper2 = new Cropper(image2, {
//             autoCropArea: 1,
//             viewMode: 1,
//             scalable: false,
//             zoomable: false,
//             movable: false,
//             minCropBoxWidth: 50,
//             minCropBoxHeight: 50,
//         })
//         crop_btn2.addEventListener('click', () => {
//             cropper2.getCroppedCanvas().toBlob((blob) => {
//                 let fileInputElement1 = document.getElementById('id_image2');
//                 let file1 = new File([blob], img_data1.name, { type: "image/*", lastModified: new Date().getTime() });
//                 let container1 = new DataTransfer();
//                 container1.items.add(file1);
//                 fileInputElement1.files = container1.files;
//                 document.getElementById('imgView2').src = URL.createObjectURL(fileInputElement1.files[0])
//                 document.getElementById('image-box1').style.display = 'none'
//                 document.getElementById('crop-btn1').style.display = 'none'
//             })
//         })
//     })




//     const imagebox3 = document.getElementById('image-box1')
//     const crop_btn3 = document.getElementById('crop-btn1')
//     const input3 = document.getElementById('id_image3')
//     function fileValidation3(event) {


//         var fileInput = document.getElementById('id_image3');

//         var filePath = fileInput.value;
//         var allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
//         if (!allowedExtensions.exec(filePath)) {
//             fileInput.value = '';
//             swal("There is a problem!", "Please choose image file.");
//             return false;
//         } else {
//             document.getElementById('imgView3').src = URL.createObjectURL(event.target.files[0])

//         }

//     }

//     input3.addEventListener('change', () => {

//         const img_data1 = input3.files[0]
//         const url1 = URL.createObjectURL(img_data1)
//         imagebox3.innerHTML = `<img src="${url1}" id="image3" style="width:100%;">`
//         const image3 = document.getElementById('image3')
//         document.getElementById('image-box1').style.display = 'block'
//         document.getElementById('crop-btn1').style.display = 'block'
//         const cropper3 = new Cropper(image3, {
//             autoCropArea: 1,
//             viewMode: 1,
//             scalable: false,
//             zoomable: false,
//             movable: false,
//             minCropBoxWidth: 50,
//             minCropBoxHeight: 50,
//         })
//         crop_btn3.addEventListener('click', () => {
//             cropper3.getCroppedCanvas().toBlob((blob) => {
//                 let fileInputElement1 = document.getElementById('id_image3');
//                 let file1 = new File([blob], img_data1.name, { type: "image/*", lastModified: new Date().getTime() });
//                 let container1 = new DataTransfer();
//                 container1.items.add(file1);
//                 fileInputElement1.files = container1.files;
//                 document.getElementById('imgView3').src = URL.createObjectURL(fileInputElement1.files[0])
//                 document.getElementById('image-box1').style.display = 'none'
//                 document.getElementById('crop-btn1').style.display = 'none'
//             })
//         })
//     })


