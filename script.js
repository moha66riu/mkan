let currentRole = '';
let token = '';
let selectedTable = null;
let selectedItems = [];
let users = JSON.parse(localStorage.getItem('users')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let menu = JSON.parse(localStorage.getItem('menu')) || [];
let salesReport = JSON.parse(localStorage.getItem('salesReport')) || [];

// تكوين Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCDwBkNYGIDM9qi7wDZBNgcmIcc9KNuay0",
  authDomain: "mkan-508c9.firebaseapp.com",
  databaseURL: "https://mkan-508c9-default-rtdb.firebaseio.com",
  projectId: "mkan-508c9",
  storageBucket: "mkan-508c9.appspot.com",
  messagingSenderId: "440042819297",
  appId: "1:440042819297:web:d571aa0840e4fae64b31a0",
  measurementId: "G-HV103S9FBR"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// تهيئة Analytics (اختياري)
const analytics = firebase.analytics();

// تهيئة Messaging (لإشعارات FCM)
const messaging = firebase.messaging();

// طلب إذن لتلقي الإشعارات
messaging.requestPermission()
  .then(() => {
    console.log("تم منح إذن الإشعارات.");
    return messaging.getToken();
  })
  .then((token) => {
    console.log("FCM Token:", token);
    // يمكنك إرسال هذا الرمز إلى خادمك لتخزينه واستخدامه لاحقًا في إرسال الإشعارات
  })
  .catch((error) => {
    console.error("خطأ في طلب الإذن للإشعارات:", error.message);
  });

// استقبال الإشعارات عندما يكون التطبيق مفتوحًا
messaging.onMessage((payload) => {
  console.log("تم استلام رسالة:", payload);
});

// تهيئة المستخدمين الافتراضيين
function initializeUsers() {
  if (users.length === 0) {
    // إنشاء محاسب (Admin)
    users.push({
      id: generateId(),
      email: 'admin@mk.com',
      password: 'admin1234', // كلمة سر المحاسب
      role: 'accountant'
    });

    // إنشاء عامل
    users.push({
      id: generateId(),
      email: 'emp@mk.com',
      password: 'emp1234', // كلمة سر العامل الافتراضية
      role: 'worker'
    });

    saveData('users', users);
  }
}

// تسجيل مستخدم جديد باستخدام Firebase
function signUp(email, password) {
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("تم إنشاء المستخدم بنجاح:", userCredential.user);
    })
    .catch((error) => {
      console.error("خطأ في تسجيل المستخدم:", error.message);
    });
}

// تسجيل الدخول باستخدام Firebase
function firebaseLogin(email, password) {
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("تم تسجيل الدخول بنجاح:", userCredential.user);
    })
    .catch((error) => {
      console.error("خطأ في تسجيل الدخول:", error.message);
    });
}

// تسجيل الدخول باستخدام Local Storage
function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('login-error');
  errorMsg.innerText = '';

  const user = users.find(user => user.email === email && user.password === password);

  if (user) {
    token = generateToken(); // رمز توكن وهمي
    currentRole = user.role;
    showRoleSelection();
    updateSidebar();
    if (currentRole === 'accountant') {
      document.querySelectorAll('.accountant-only').forEach(el => el.classList.remove('hidden'));
      document.querySelectorAll('.worker-only').forEach(el => el.classList.remove('hidden'));
    } else if (currentRole === 'worker') {
      document.querySelectorAll('.accountant-only').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.worker-only').forEach(el => el.classList.remove('hidden'));
    }
  } else {
    errorMsg.innerText = 'البريد الإلكتروني أو كلمة السر غير صحيحة';
  }
}

// توليد رمز توكن وهمي
function generateToken() {
  return Math.random().toString(36).substr(2);
}

// توليد معرف فريد
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// عرض شاشة اختيار الدور
function showRoleSelection() {
  showScreen('role-selection-screen');
}

// اختيار الدور
function selectRole(role) {
  const currentUser = users.find(user => user.email === document.getElementById('email').value.trim());
  if (role === 'worker') {
    if (currentUser.role !== 'worker') {
      alert('غير مسموح لك بالدخول كعامل');
      return;
    }
    showTablesScreen();
  } else if (role === 'accountant') {
    if (currentUser.role !== 'accountant') {
      alert('غير مسموح لك بالدخول كمحاسب');
      return;
    }
    showTablesScreen();
  }
}

// عرض شاشة الطاولات بناءً على الدور
function showTablesScreen() {
  if (currentRole === 'worker') {
    showScreen('worker-screen');
  } else if (currentRole === 'accountant') {
    showScreen('accountant-screen');
  }
  loadTables();
}

// تسجيل الخروج
function logout() {
  token = '';
  currentRole = '';
  selectedTable = null;
  selectedItems = [];
  showScreen('login-screen');
  updateSidebar();
  // إخفاء الشريط الجانبي عند تسجيل الخروج
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.add('hidden');
  sidebar.classList.remove('active');
}

// عرض شاشة معينة
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
    screen.classList.add('hidden');
  });
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    screen.classList.remove('hidden');
  }
}

// تحديث الشريط الجانبي بناءً على الدور
function updateSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (token && currentRole) {
    sidebar.classList.remove('hidden');
  } else {
    sidebar.classList.add('hidden');
  }
}

// تحميل الطاولات
function loadTables() {
  const tablesContainer = document.getElementById('tables-container');
  tablesContainer.innerHTML = '';
  for (let i = 1; i <= 55; i++) {
    const tableDiv = document.createElement('div');
    tableDiv.classList.add('table');
    tableDiv.innerText = `طاولة ${i}`;
    tableDiv.dataset.tableId = i;
    tableDiv.onclick = () => handleTableClick(i);
    tablesContainer.appendChild(tableDiv);
  }

  // تحميل حالة الطاولات من الطلبات المخزنة
  orders.forEach(order => {
    if (order.status === 'pending') {
      const tableDiv = tablesContainer.querySelector(`.table[data-table-id='${order.tableNumber}']`);
      if (tableDiv) {
        tableDiv.classList.add('active');
      }
    }
  });
}

// التعامل مع نقر على الطاولة
function handleTableClick(tableId) {
  selectedTable = tableId;
  if (currentRole === 'worker') {
    selectedItems = [];
    showScreen('menu-screen');
    loadMenuCategories();
    loadSelectedItems();
  } else if (currentRole === 'accountant') {
    viewTableOrders(tableId);
  }
}

// تحميل فئات المنيو للعامل
function loadMenuCategories() {
  const menuCategoriesContainer = document.getElementById('menu-categories');
  menuCategoriesContainer.innerHTML = '';

  if (menu.length === 0) {
    menuCategoriesContainer.innerHTML = '<p>لا توجد أصناف متاحة.</p>';
    return;
  }

  const categories = [...new Set(menu.map(item => item.category))];

  categories.forEach(category => {
    const categoryBox = document.createElement('div');
    categoryBox.classList.add('menu-category-box');
    categoryBox.innerText = category;
    categoryBox.onclick = () => toggleCategory(categoryBox, category);
    menuCategoriesContainer.appendChild(categoryBox);
  });
}

// تفعيل أو إلغاء تفعيل الفئة وعرض الأصناف
function toggleCategory(categoryBox, category) {
  const isActive = categoryBox.classList.contains('active');
  // إغلاق جميع الفئات
  document.querySelectorAll('.menu-category-box').forEach(box => {
    box.classList.remove('active');
  });
  document.querySelectorAll('.menu-items').forEach(items => {
    items.remove();
  });

  if (!isActive) {
    categoryBox.classList.add('active');
    const menuItemsContainer = document.createElement('div');
    menuItemsContainer.classList.add('menu-items');
    menuItemsContainer.innerHTML = '';

    const items = menu.filter(item => item.category === category);
    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('menu-item');
      itemDiv.innerHTML = `
        <span>${item.name} - ${item.price}₪</span>
        <button class="btn green" onclick="selectMenuItem('${item.id}')">إضافة</button>
      `;
      menuItemsContainer.appendChild(itemDiv);
    });

    categoryBox.insertAdjacentElement('afterend', menuItemsContainer);
  }
}

// اختيار صنف من المنيو للعامل
function selectMenuItem(itemId) {
  const item = menu.find(item => item.id === itemId);
  if (item) {
    selectedItems.push(item);
    loadSelectedItems();

    // تغيير لون الطاولة إلى برتقالي
    const tableDiv = document.querySelector(`.table[data-table-id='${selectedTable}']`);
    if (tableDiv) {
      tableDiv.classList.add('active');
    }
  }
}

// تحميل الطلبات المحددة
function loadSelectedItems() {
  const selectedContainer = document.getElementById('selected-items');
  selectedContainer.innerHTML = '';
  selectedItems.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('selected-item');
    itemDiv.innerHTML = `
      ${item.name} - ${item.price}₪
      <button class="delete-btn" onclick="removeSelectedItem(${index})">X</button>
    `;
    selectedContainer.appendChild(itemDiv);
  });
}

// إزالة صنف من الطلبات المحددة
function removeSelectedItem(index) {
  selectedItems.splice(index, 1);
  loadSelectedItems();

  // إذا لم يتبق أي أصناف، تغيير لون الطاولة إلى رمادي
  if (selectedItems.length === 0) {
    const tableDiv = document.querySelector(`.table[data-table-id='${selectedTable}']`);
    if (tableDiv) {
      tableDiv.classList.remove('active');
    }
  }
}

// إرسال الطلب إلى التخزين المحلي
function submitOrder() {
  if (!selectedTable || selectedItems.length === 0) {
    alert('يرجى اختيار طاولة وإضافة أصناف للطلب');
    return;
  }

  const notes = document.getElementById('order-notes').value.trim();

  const newOrder = {
    id: generateId(),
    tableNumber: selectedTable,
    items: selectedItems.map(item => ({ id: item.id, name: item.name, price: item.price })),
    status: 'pending',
    timestamp: new Date().toISOString(),
    notes: notes // إضافة الملاحظات
  };

  orders.push(newOrder);
  saveData('orders', orders);

  alert('تم إرسال الطلب بنجاح');
  selectedItems = [];
  document.getElementById('order-notes').value = ''; // مسح الملاحظات
  loadSelectedItems();
  showTablesScreen();
  loadTables(); // تحديث حالة الطاولات
}

// عرض الطلبات الخاصة بطاولة معينة للمحاسب
function viewTableOrders(tableId) {
  const tableOrders = orders.filter(order => order.tableNumber == tableId && order.status === 'pending');
  if (tableOrders.length === 0) {
    alert(`لا توجد طلبات جديدة للطاولة ${tableId}`);
    return;
  }

  showScreen('orders-details-screen');
  document.getElementById('table-number').innerText = tableId;
  const ordersDetailsContainer = document.getElementById('orders-details');
  ordersDetailsContainer.innerHTML = '';

  tableOrders.forEach((order, index) => {
    const orderDiv = document.createElement('div');
    orderDiv.classList.add('order-item');
    let itemsList = '<ul>';
    order.items.forEach(item => {
      itemsList += `<li>${item.name} - ${item.price}₪</li>`;
    });
    itemsList += '</ul>';

    orderDiv.innerHTML = `
      <h4>طلب ${index + 1}</h4>
      ${itemsList}
      <p>ملاحظات: ${order.notes || 'لا توجد'}</p>
    `;
    ordersDetailsContainer.appendChild(orderDiv);
  });
}

// تسديد الطاولة
function settleTable() {
  const tableId = selectedTable;
  const tableOrders = orders.filter(order => order.tableNumber == tableId && order.status === 'pending');
  if (tableOrders.length === 0) {
    alert('لا توجد طلبات لتسديدها');
    return;
  }

  let totalAmount = 0;
  tableOrders.forEach(order => {
    totalAmount += order.items.reduce((sum, item) => sum + item.price, 0);
  });

  if (confirm(`هل تريد تسديد الطاولة ${tableId} بمبلغ ${totalAmount}₪؟`)) {
    // تسديد جميع الطلبات المرتبطة بهذه الطاولة
    tableOrders.forEach(order => {
      order.status = 'paid';
      salesReport.push(order);
    });
    // تحديث قائمة الطلبات
    orders = orders.filter(order => !(order.tableNumber == tableId && order.status === 'paid'));
    saveData('orders', orders);
    saveData('salesReport', salesReport);
    alert('تم تسديد الطاولة بنجاح');
    showScreen(currentRole === 'worker' ? 'worker-screen' : 'accountant-screen'); // العودة إلى شاشة العامل أو المحاسب حسب الدور
    loadTables();
    loadSalesReport();
  }
}

// العودة إلى شاشة الطاولات
function goBack() {
  showTablesScreen();
}

// العودة من شاشة اختيار الدور
function goBackFromRoleSelection() {
  showScreen('login-screen');
}

// إدارة العمال (المحاسب)
function manageWorkers() {
  if (currentRole !== 'accountant') {
    alert('ليس لديك الصلاحيات اللازمة');
    return;
  }
  showScreen('manage-workers-screen');
  loadWorkers();
}

// تحميل قائمة العمال
function loadWorkers() {
  const workersList = document.getElementById('workers-list');
  workersList.innerHTML = '';

  const workers = users.filter(user => user.role === 'worker');

  if (workers.length === 0) {
    workersList.innerHTML = '<p>لا توجد عمال.</p>';
    return;
  }

  workers.forEach(worker => {
    const workerDiv = document.createElement('div');
    workerDiv.classList.add('worker-item');
    workerDiv.innerHTML = `
      <span>${worker.email}</span>
      <button class="change-password-btn" onclick="changeWorkerPassword('${worker.id}')">تغيير كلمة السر</button>
      <button class="delete-btn" onclick="removeWorker('${worker.id}')">حذف</button>
    `;
    workersList.appendChild(workerDiv);
  });
}

// إضافة عامل جديد (المحاسب فقط)
function addWorker() {
  if (currentRole !== 'accountant') {
    alert('ليس لديك الصلاحيات اللازمة');
    return;
  }

  const email = document.getElementById('new-worker-email').value.trim();
  const password = document.getElementById('new-worker-password').value.trim();

  if (!email || !password) {
    alert('يرجى ملء جميع الحقول');
    return;
  }

  if (users.some(user => user.email === email)) {
    alert('البريد الإلكتروني مستخدم بالفعل');
    return;
  }

  const newWorker = {
    id: generateId(),
    email,
    password,
    role: 'worker'
  };

  users.push(newWorker);
  saveData('users', users);

  alert('تم إضافة الموظف بنجاح');
  document.getElementById('new-worker-email').value = '';
  document.getElementById('new-worker-password').value = '';
  loadWorkers();
}

// تغيير كلمة سر العامل
function changeWorkerPassword(workerId) {
  const worker = users.find(user => user.id === workerId);
  if (!worker) {
    alert('العامل غير موجود');
    return;
  }

  const newPassword = prompt('أدخل كلمة السر الجديدة للعامل:');
  if (newPassword && newPassword.trim() !== '') {
    worker.password = newPassword.trim();
    saveData('users', users);
    alert('تم تغيير كلمة السر بنجاح');
  } else {
    alert('كلمة السر الجديدة غير صالحة');
  }
}

// إزالة عامل (المحاسب فقط)
function removeWorker(workerId) {
  if (currentRole !== 'accountant') {
    alert('ليس لديك الصلاحيات اللازمة');
    return;
  }

  if (!confirm('هل أنت متأكد من حذف هذا العامل؟')) return;

  users = users.filter(user => user.id !== workerId);
  saveData('users', users);

  alert('تم حذف العامل بنجاح');
  loadWorkers();
}

// إدارة المنيو (المحاسب)
function manageMenu() {
  if (currentRole !== 'accountant') {
    alert('ليس لديك الصلاحيات اللازمة');
    return;
  }
  showScreen('menu-management-screen');
  // إظهار الفئات الافتراضية عند دخول إدارة المنيو
  showMenuCategory('cold');
}

// عرض تصنيف معين من المنيو في إدارة المنيو
function showMenuCategory(category) {
  const menuManagementContent = document.getElementById('menu-management-content');
  menuManagementContent.innerHTML = ''; // مسح المحتوى الحالي

  let categoryName = '';
  switch(category) {
    case 'cold':
      categoryName = 'مشاريب باردة';
      break;
    case 'hot':
      categoryName = 'مشاريب ساخنة';
      break;
    case 'other':
      categoryName = 'خدمات أخرى';
      break;
    default:
      categoryName = '';
  }

  const categoryHeader = document.createElement('h3');
  categoryHeader.textContent = categoryName;
  menuManagementContent.appendChild(categoryHeader);

  // إضافة نموذج لإضافة صنف جديد داخل كل فئة
  const addItemForm = document.createElement('div');
  addItemForm.classList.add('add-menu-item-form');
  addItemForm.innerHTML = `
    <input type="text" id="new-item-name-${category}" placeholder="اسم الصنف" required>
    <input type="number" id="new-item-price-${category}" placeholder="سعر الصنف" required>
    <button class="btn green" onclick="addMenuItem('${category}')">إضافة</button>
  `;
  menuManagementContent.appendChild(addItemForm);

  const items = menu.filter(item => item.category === categoryName);
  if (items.length === 0) {
    menuManagementContent.innerHTML += '<p>لا توجد أصناف في هذا التصنيف.</p>';
    return;
  }

  items.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('menu-list-item');
    itemDiv.innerHTML = `
      <span>${item.name} - ${item.price}₪</span>
      <button class="delete-btn" onclick="deleteMenuItem('${item.id}')">حذف</button>
    `;
    menuManagementContent.appendChild(itemDiv);
  });
}

// إضافة صنف جديد إلى المنيو
function addMenuItem(category) {
  const nameInput = document.getElementById(`new-item-name-${category}`);
  const priceInput = document.getElementById(`new-item-price-${category}`);

  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  let categoryName = '';

  switch (category) {
    case 'cold':
      categoryName = 'مشاريب باردة';
      break;
    case 'hot':
      categoryName = 'مشاريب ساخنة';
      break;
    case 'other':
      categoryName = 'خدمات أخرى';
      break;
    default:
      categoryName = '';
  }

  if (!name || isNaN(price) || !categoryName) {
    alert('يرجى ملء جميع الحقول بشكل صحيح');
    return;
  }

  // التحقق من عدم تكرار اسم الصنف
  if (menu.some(item => item.name.toLowerCase() === name.toLowerCase())) {
    alert('الصنف موجود بالفعل');
    return;
  }

  const newItem = {
    id: generateId(),
    name,
    price,
    category: categoryName
  };

  menu.push(newItem);
  saveData('menu', menu);

  alert('تم إضافة الصنف بنجاح');
  showMenuCategory(category); // إعادة تحميل التصنيف الحالي
  // تحديث المنيو في شاشة العامل
  loadMenuCategories();
}

// حذف صنف من المنيو
function deleteMenuItem(itemId) {
  if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;

  menu = menu.filter(item => item.id !== itemId);
  saveData('menu', menu);

  alert('تم حذف الصنف بنجاح');
  // تحديث المحتوى في إدارة المنيو حسب الفئة الحالية
  const currentCategory = document.querySelector('#menu-management-content h3')?.textContent;
  let categoryKey = '';
  if (currentCategory === 'مشاريب باردة') categoryKey = 'cold';
  if (currentCategory === 'مشاريب ساخنة') categoryKey = 'hot';
  if (currentCategory === 'خدمات أخرى') categoryKey = 'other';
  if (categoryKey) showMenuCategory(categoryKey);
  // تحديث المنيو في شاشة العامل
  loadMenuCategories();
}

// عرض كشف المبيعات
function viewSales() {
  if (currentRole !== 'accountant' && currentRole !== 'worker') {
    alert('ليس لديك الصلاحيات اللازمة');
    return;
  }
  showScreen('sales-report-screen');
  loadSalesReport();
}

// تحميل كشف المبيعات وعرضه في جدول
function loadSalesReport() {
  const salesTableBody = document.querySelector('#sales-table tbody');
  salesTableBody.innerHTML = '';

  const paidOrders = salesReport.filter(order => order.status === 'paid');

  if (paidOrders.length === 0) {
    salesTableBody.innerHTML = '<tr><td colspan="5">لا توجد مبيعات مسددة.</td></tr>';
    return;
  }

  paidOrders.forEach(order => {
    order.items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${order.tableNumber}</td>
        <td>${item.name}</td>
        <td>${item.price}₪</td>
        <td>${new Date(order.timestamp).toLocaleString()}</td>
        <td>${order.notes || 'لا توجد'}</td>
      `;
      salesTableBody.appendChild(row);
    });
  });
}

// حذف جميع بيانات الكشف اليومي (المحاسب فقط)
function deleteAllSales() {
  if (currentRole !== 'accountant') {
    alert('ليس لديك الصلاحيات اللازمة');
    return;
  }

  if (!confirm('هل أنت متأكد من حذف جميع بيانات الكشف اليومي؟')) return;

  salesReport = [];
  saveData('salesReport', salesReport);
  alert('تم حذف جميع بيانات الكشف اليومي بنجاح');
  loadSalesReport();
}

// دالة goHome لعرض الشاشة الرئيسية بناءً على دور المستخدم
function goHome() {
  if (currentRole === 'worker') {
    showScreen('worker-screen');  // عرض شاشة العامل
  } else if (currentRole === 'accountant') {
    showScreen('accountant-screen');  // عرض شاشة المحاسب
  } else {
    alert('يرجى تسجيل الدخول أولاً.');
  }
}

// دالة التبديل بين الشريط الجانبي
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('active');
}

// حفظ البيانات في التخزين المحلي
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// تحميل المنيو من التخزين المحلي أو من Firebase
function loadMenu() {
  // في المستقبل، يمكن استبدال هذا بعمليات Firebase
  menu = JSON.parse(localStorage.getItem('menu')) || [];
}

// تحميل كشف المبيعات من التخزين المحلي أو من Firebase
function loadSalesReport() {
  // في المستقبل، يمكن استبدال هذا بعمليات Firebase
  salesReport = JSON.parse(localStorage.getItem('salesReport')) || [];
}

// تحميل المنيو وإعداد الشاشات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  initializeUsers();
  loadMenu(); // تحميل المنيو عند بدء التطبيق
  loadSalesReport(); // تحميل كشف المبيعات عند بدء التطبيق
  // تأكد من أن جميع الشاشات تحتوي على خاصية التمرير
  document.querySelectorAll('.screen').forEach(screen => {
    screen.style.overflow = 'hidden';
  });
});
