document.addEventListener('DOMContentLoaded', function () {
    // Initial fetch to get all pets
    fetch('/api/pets')  // Replace with your actual API endpoint
        .then(response => response.json())
        .then(pets => {
            displayPets(pets);  // Call function to display pets initially
        })
        .catch(error => console.error('Error fetching pet data:', error));

    // Adding search functionality for pet types
    document.getElementById('search-button').addEventListener('click', function (event) {
        event.preventDefault(); // Prevent form submission

        // Get the value of the input field (search by pet type)
        const searchValue = document.getElementById('pincode-search').value.toLowerCase();

        // Fetch all pets and filter them based on the search value
        fetch('/api/pets')  // Replace with your actual API endpoint
            .then(response => response.json())
            .then(pets => {
                // Filter the pets array by the type (e.g., dog, cat)
                const filteredPets = pets.filter(pet => pet.type.toLowerCase() === searchValue);

                // Display filtered pets or show "No pets found" if none match
                displayPets(filteredPets);
            })
            .catch(error => console.error('Error fetching pet data:', error));
    });
});

function displayPets(pets) {
    const petSection = document.getElementById('second-section');
    petSection.innerHTML = '';  // Clear the section before displaying new pets

    if (pets.length === 0) {
        // Show "No pets found" message if no pets match the search criteria
        const noPetsMessage = `
            <div class="col-12">
                <h3>No pets found for this search.</h3>
            </div>
        `;
        petSection.innerHTML = noPetsMessage;
        return;
    }

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
