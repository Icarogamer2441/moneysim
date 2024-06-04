import './style.css'
import { createClient } from '@supabase/supabase-js'

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Money simulator</h1>
    <form id="register-form">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username"><br><br>
      <label for="password">Password:</label>
      <input type="password" id="password" name="password"><br><br>
      <button type="submit">Register</button>
    </form>
    <form id="login-form">
      <label for="username">Username:</label>
      <input type="text" id="username2" name="username"><br><br>
      <label for="password">Password:</label>
      <input type="password" id="password2" name="password"><br><br>
      <button type="submit">Login</button>
      <input type="checkbox" id="remember-me"> Remember me
    </form>
    <div id="balance-display"></div>
  </div>
`

const supabaseUrl = 'https://jytoofazvookoajsvljw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dG9vZmF6dm9va29hanN2bGp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc1MTE2MTAsImV4cCI6MjAzMzA4NzYxMH0.qFO9Q2SX9ZKFryQvzGJfIqrQ6568xolwKlxuNBUgR9o';
const supabase = createClient(supabaseUrl, supabaseKey);

// Register form submission handler
document.querySelector('#register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.querySelector('#username').value;
  const password = document.querySelector('#password').value;
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({ email: username, password, balance: 0 });
    if (error) {
      console.error(error);
    } else {
      console.log(data);
      alert(`User created successfully!`);
    }
  } catch (error) {
    console.error(error);
  }
  document.querySelector('#login-form').style.display = 'block';
});

// Login form submission handler
document.querySelector('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.querySelector('#username2').value;
  const password = document.querySelector('#password2').value;
  const rememberMe = document.querySelector('#remember-me').checked;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, password, balance')
      .eq('email', username)
      .eq('password', password);

    if (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        alert('Invalid username or password');
      } else {
        alert('An unexpected error occurred. Please try again later.');
      }
      return; // Stop further processing if an error occurs
    }

    if (data.length === 0) {
      alert('Invalid username or password');
      return; // Stop further processing if no user is found
    }

    // Successful login
    console.log(data);
    alert(`Logged in successfully!`);

    // Update balance display
    const balance = data[0].balance;
    document.querySelector('#balance-display').innerHTML = `Your balance: ${balance}`;

    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(data[0]));
    } else {
      localStorage.removeItem('user');
    }

    // Auto-login on page load
    checkAutoLogin();

    // Hide login form and show balance display
    document.querySelector('#balance-display').style.display = 'block';
  } catch (error) {
    console.error(error);
  }
});

// Function to check for auto-login on page load
function checkAutoLogin() {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    console.log('Auto-logging in user:', user);

    // Update balance display and set logged-in state
    getUserBalance(user.email);

    // Hide login form and show balance display
    document.querySelector('#balance-display').style.display = 'block';
  }
}

// Function to fetch user balance
async function getUserBalance(userEmail) {
  if (!userEmail) {
    return;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('balance')
      .eq('email', userEmail);
    if (error) {
      console.error(error);
      return;
    }

    if (data.length > 0) {
      const balance = data[0].balance;
      document.querySelector('#balance-display').innerHTML = `Your balance: ${balance}`;
    } else {
      console.error('User not found');
    }
  } catch (error) {
    console.error(error);
  }
}

// Check for auto-login on page load
checkAutoLogin();

// Function to withdraw money
async function withdrawMoney(amount) {
  if (!amount || amount <= 0) {
    alert('Invalid withdrawal amount');
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('user'));
  if (!currentUser) {
    alert('Please log in to withdraw money');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ balance: { decrement: amount } })
      .eq('email', currentUser.email);
    if (error) {
      console.error(error);
      return;
    }

    if (data.length > 0) {
      const newBalance = data[0].balance - amount;
      document.querySelector('#balance-display').innerHTML = `Your balance: ${newBalance}`;
      alert(`Successfully withdrawn ${amount}`);
    } else {
      console.error('User not found');
    }
  } catch (error) {
    console.error(error);
  }
}

// ... (rest of your code)

// Donation form
const donationForm = document.createElement('form');
donationForm.id = 'donation-form';
donationForm.innerHTML = `
  <label for="username">Username to Donate To:</label>
  <input type="text" id="username3" name="username"><br><br>
  <label for="amount">Amount to Donate:</label>
  <input type="number" id="amount" name="amount"><br><br>
  <button type="submit">Donate</button>
`;

// Append donation form to app container
const appContainer = document.querySelector('#app');
appContainer.appendChild(donationForm);

// Donation form submission handler
donationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const recipientUsername = document.querySelector('#username3').value;
  const donationAmount = parseInt(document.querySelector('#amount').value);

  if (!recipientUsername || !donationAmount || donationAmount <= 0) {
    alert('Invalid donation details. Please enter a valid username and amount.');
    return;
  }

  try {
    // Check if recipient exists
    const { data: recipientData, error: recipientError } = await supabase
      .from('users')
      .select('id, balance')
      .eq('email', recipientUsername);

    if (recipientError) {
      console.error(recipientError);
      alert('An error occurred while fetching recipient details.');
      return;
    }

    if (recipientData.length === 0) {
      alert('Recipient username not found. Please check the username and try again.');
      return;
    }

    const recipientId = recipientData[0].id;
    const recipientBalance = recipientData[0].balance;

    // Check if current user has sufficient balance
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser.id;
    const currentBalance = currentUser.balance;

    console.log(currentBalance)
    if (donationAmount > currentBalance) {
      alert('Insufficient balance. You cannot donate more than you have.');
      return;
    }

    // Update balances for both users
    const [donorUpdate, recipientUpdate] = await Promise.all([
      supabase
        .from('users')
        .update({ balance: currentBalance - donationAmount }) // Update with negative value for decrement
        .eq('id', currentUserId),
      supabase
        .from('users')
        .update({ balance: donationAmount + recipientBalance })
        .eq('id', recipientId),
    ]);    

    if (donorUpdate.error || recipientUpdate.error) {
      console.error(donorUpdate.error || recipientUpdate.error);
      alert('An error occurred while updating balances. Please try again later.');
      return;
    }

    // Update local storage for current user's balance
    currentUser.balance -= donationAmount;
    localStorage.setItem('user', JSON.stringify(currentUser));

    // Update balance display for current user
    document.querySelector('#balance-display').innerHTML = `Your balance: ${currentUser.balance}`;

    alert(`Donation of ${donationAmount} successful!`);

    // Clear donation form fields
    document.querySelector('#username').value = '';
    document.querySelector('#amount').value = '';
  } catch (error) {
    console.error(error);
    alert('An unexpected error occurred. Please try again later.');
  }
});
