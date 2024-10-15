// // Get all the cards
// const cards = document.querySelectorAll('.card');

// // Get the message element
// const message = document.getElementById('message');

// // Add an event listener to the search form
// document.querySelector('form[role="search"]').addEventListener('submit', function (event) {
//     event.preventDefault(); // Prevent the form from submitting

//     // Get the value of the input field
//     const pincode = document.querySelector('#pincode-search').value;

//         // If search input is empty, display all cards
//         if (pincode === '') {
//           cards.forEach(function (card) {
//               card.style.display = 'block';
//           });
//           message.style.display = 'none';
//           return; // exit function early
//       }

//     // Set a flag to check if any card is found for the given pincode
//     let isCardFound = false;

//     // Filter the cards based on the pincode
//     cards.forEach(function (card) {
//         if (card.dataset.pincode === pincode) {
//             card.style.display = 'block';
//             isCardFound = true;
//         } else {
//             card.style.display = 'none';
//         }
//     });

//     // Show the message if no card is found for the given pincode
//     if (!isCardFound) {
//         message.style.display = 'block';
//     } else {
//         message.style.display = 'none';
//     }
// });

// // code to make the elements take up the left out space
// // get the rows
// const row1 = document.querySelector('#second-section .venue-row:nth-of-type(1)');
// const row2 = document.querySelector('#second-section .venue-row:nth-of-type(2)');

// // get the cards in row 2
// const cards1 = row2.querySelectorAll('.card');

// // loop through the cards and move them to row 1 if there is space
// cards1.forEach(card => {
//   if (row1.offsetHeight >= row2.offsetHeight) {
//     // move the card to row 1
//     row1.appendChild(card);
//   }
// });

// //search bar code
// const searchInput = document.getElementById('pincode-search');
// searchInput.addEventListener('input', function() {
//   if (searchInput.value.length > 6) {
//     searchInput.value = searchInput.value.slice(0, 6);
//   }
// });
// JavaScript to fetch pet data from the server and dynamically display it
// JavaScript to fetch pet data from the server and dynamically display it

document.addEventListener('DOMContentLoaded', function () {
    // Fetching the pet data from your API
    fetch('/api/pets')  // Replace with your actual API endpoint
        .then(response => response.json())
        .then(pets => {
            displayPets(pets);  // Call function to display pets
        })
        .catch(error => console.error('Error fetching pet data:', error));
});

function displayPets(pets) {
    const petSection = document.getElementById('second-section');
    let rowDiv = document.createElement('div');
    rowDiv.className = 'row'; // Bootstrap row to organize cards

    pets.forEach((pet, index) => {
        // Handle photo path: if photo exists, use it; otherwise, fallback to a placeholder
        const petPhoto = pet.photo ? '/uploads/' + pet.photo.split('\\').pop() : 'https://via.placeholder.com/150';

        const petCard = `
            <div class="col-lg-4 col-md-6 mb-4">  <!-- Use col-lg-4 to ensure 3 cards per row -->
                <div class="card">
                    <!-- Card Image -->
                    <img src="${petPhoto}" alt="${pet.name}" class="card__image">

                    <div class="card__info">
                        <!-- Pet Name -->
                        <h3 class="pet-name">${pet.name}</h3>

                        <!-- Pet Details in Table -->
                        <table class="table">
                            <tr>
                                <th>Type</th>
                                <td>${pet.type}</td>
                            </tr>
                            <tr>
                                <th>Vaccinated</th>
                                <td>${pet.vaccination ? 'Yes' : 'No'}</td>
                            </tr>
                            <tr>
                                <th>Age</th>
                                <td>${pet.age} Years</td>
                            </tr>
                            <tr>
                                <th>Breed</th>
                                <td>${pet.breed}</td>
                            </tr>
                            <tr>
                                <th>Neutered</th>
                                <td>${pet.neutered ? 'Yes' : 'No'}</td>
                            </tr>
                            <tr>
                                <th>Gender</th>
                                <td>${pet.gender}</td>
                            </tr>
                        </table>

                        <!-- Adopt Button -->
                        <div class="card_button_div">
                          <a href="/adoptpet/${pet._id}" class="card__button">Adopt ${pet.name}!</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Append the card to the current row
        rowDiv.innerHTML += petCard;

        // After every 3rd card, or the last pet, append the row and start a new one
        if ((index + 1) % 3 === 0 || index === pets.length - 1) {
            petSection.appendChild(rowDiv);
            rowDiv = document.createElement('div');
            rowDiv.className = 'row'; // Start a new row for the next set of cards
        }
    });
}



