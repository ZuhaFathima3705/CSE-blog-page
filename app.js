
const get = (k, v=[]) => JSON.parse(localStorage.getItem(k) || JSON.stringify(v));
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));


(function seed(){
  if(!localStorage.getItem('seeded')){
    set('blogs', [
      {
        id: crypto.randomUUID(),
        title: "Hackathon 2023 – Winners & Highlights",
        date: "2023-10-05",
        author: "Admin",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200",
        desc: "A 24-hour coding sprint—25 teams, pizza, and three awards! Congrats to Team Nebula for their ML-powered accessibility tool."
      },
      {
        id: crypto.randomUUID(),
        title: "Workshop: Web Dev Bootcamp",
        date: "2024-03-15",
        author: "Core Team",
        image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1200",
        desc: "Hands-on intro to HTML, CSS and JS. 90+ attendees, lots of demos, and fun stickers 🎉"
      }
    ]);
    set('projects', [
      {
        id: crypto.randomUUID(),
        title: "Website Revamp",
        status: "current",
        image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200",
        about: "Rebuilding the club portal with modern UI, accessibility, and PWA support."
      },
      {
        id: crypto.randomUUID(),
        title: "AI Chatbot",
        status: "future",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200",
        about: "Planned assistant to answer FAQs and guide new members."
      },
      {
        id: crypto.randomUUID(),
        title: "Library Kiosk",
        status: "previous",
        image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?q=80&w=1200",
        about: "Touch-screen search for tech magazines—completed and deployed in 2023."
      }
    ]);
    set('enrollments', []);   // {projectId, name, role, at}
    localStorage.setItem('seeded','1');
  }
})();

/* ------------------ Auth ------------------ */
function login(){
  const role = document.getElementById('roleSelect').value;
  const name = document.getElementById('nameInput').value.trim() || 'Guest';
  set('currentUser', {name, role});
  window.location.href = role === 'admin' ? 'admin.html' : 'home.html';
}
function currentUser(){ return get('currentUser', {name:'Guest', role:'guest'}); }

/* ------------------ Blogs (list + details) ------------------ */
function renderBlogs(){
  const wrap = document.getElementById('blogs');
  if(!wrap) return;

  const blogs = get('blogs');
  const {role} = currentUser();

  wrap.innerHTML = blogs.map(b => `
    <article class="card">
      <img src="${b.image}" alt="${b.title}">
      <h3>${b.title}</h3>
      <div class="meta">${b.date} • by ${b.author}</div>
      <p>${b.desc.slice(0,120)}...</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn ghost" onclick="openBlog('${b.id}')">Read</button>
        ${role==='admin' ? `
          <button class="btn" onclick="editBlog('${b.id}')">Edit</button>
          <button class="btn warn" onclick="deleteBlog('${b.id}')">Delete</button>
        `:''}
      </div>
    </article>
  `).join('');
}

function openBlog(id){
  const b = get('blogs').find(x=>x.id===id);
  const m = document.getElementById('blogModal');
  if(!b || !m) return;
  m.querySelector('.body').innerHTML = `
    <h2>${b.title}</h2>
    <div class="meta">${b.date} • by ${b.author}</div>
    <img src="${b.image}" alt="">
    <p>${b.desc}</p>
  `;
  m.style.display = 'flex';
}
function closeModal(){ document.getElementById('blogModal').style.display='none'; }

function deleteBlog(id){
  if(!confirm('Delete this blog?')) return;
  set('blogs', get('blogs').filter(b=>b.id!==id));
  renderBlogs();
}
function editBlog(id){
  const b = get('blogs').find(x=>x.id===id);
  if(!b) return;
  // prefill admin form and scroll there
  document.getElementById('blog-id').value = b.id;
  document.getElementById('blog-title').value = b.title;
  document.getElementById('blog-date').value = b.date;
  document.getElementById('blog-image').value = b.image;
  document.getElementById('blog-author').value = b.author;
  document.getElementById('blog-desc').value = b.desc;
  window.location.hash = '#blogs-form';
}

/* Create/Update from Admin form */
function saveBlogFromForm(e){
  e.preventDefault();
  const id = document.getElementById('blog-id').value || crypto.randomUUID();
  const doc = {
    id,
    title: document.getElementById('blog-title').value.trim(),
    date: document.getElementById('blog-date').value,
    image: document.getElementById('blog-image').value.trim(),
    author: document.getElementById('blog-author').value.trim(),
    desc: document.getElementById('blog-desc').value.trim(),
  };
  const blogs = get('blogs');
  const idx = blogs.findIndex(x=>x.id===id);
  if(idx>-1) blogs[idx]=doc; else blogs.push(doc);
  set('blogs', blogs);
  alert('Saved ✅');
  (location.pathname.endsWith('admin.html') ? renderAdminLists() : renderBlogs());
  e.target.reset();
  document.getElementById('blog-id').value='';
}

/* ------------------ Projects (list + enroll) ------------------ */
function renderProjects(){
  const wrap = document.getElementById('projects');
  if(!wrap) return;
  const {role} = currentUser();
  const projects = get('projects');

  wrap.innerHTML = projects.map(p=>`
    <article class="card">
      <span class="tag">${p.status}</span>
      <img src="${p.image}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>${p.about}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn ghost" onclick="enroll('${p.id}')">Enroll</button>
        ${role==='admin' ? `
          <button class="btn" onclick="editProject('${p.id}')">Edit</button>
          <button class="btn warn" onclick="deleteProject('${p.id}')">Delete</button>
        `:''}
      </div>
    </article>
  `).join('');
}

function enroll(projectId){
  const user = currentUser();
  const enrollments = get('enrollments');
  enrollments.push({projectId, name:user.name, role:user.role, at:new Date().toISOString()});
  set('enrollments', enrollments);
  alert('Enrolled! 🎉');
}

/* Admin CRUD for projects */
function deleteProject(id){
  if(!confirm('Delete this project?')) return;
  set('projects', get('projects').filter(p=>p.id!==id));
  (location.pathname.endsWith('admin.html') ? renderAdminLists() : renderProjects());
}
function editProject(id){
  const p = get('projects').find(x=>x.id===id);
  if(!p) return;
  document.getElementById('project-id').value = p.id;
  document.getElementById('project-title').value = p.title;
  document.getElementById('project-status').value = p.status;
  document.getElementById('project-image').value = p.image;
  document.getElementById('project-about').value = p.about;
  window.location.hash = '#projects-form';
}
function saveProjectFromForm(e){
  e.preventDefault();
  const id = document.getElementById('project-id').value || crypto.randomUUID();
  const doc = {
    id,
    title: document.getElementById('project-title').value.trim(),
    status: document.getElementById('project-status').value,
    image: document.getElementById('project-image').value.trim(),
    about: document.getElementById('project-about').value.trim(),
  };
  const projects = get('projects');
  const idx = projects.findIndex(x=>x.id===id);
  if(idx>-1) projects[idx]=doc; else projects.push(doc);
  set('projects', projects);
  alert('Saved ✅');
  (location.pathname.endsWith('admin.html') ? renderAdminLists() : renderProjects());
  e.target.reset();
  document.getElementById('project-id').value='';
}

/* ------------------ Admin: listings & enrollments table ------------------ */
function renderAdminLists(){
  const listBlogs = document.getElementById('list-blogs');
  const listProjects = document.getElementById('list-projects');
  const tableEnroll = document.getElementById('enroll-table');

  if(listBlogs){
    const blogs = get('blogs');
    listBlogs.innerHTML = blogs.map(b=>`
      <div class="card">
        <strong>${b.title}</strong>
        <div class="meta">${b.date} • ${b.author}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn" onclick="editBlog('${b.id}')">Edit</button>
          <button class="btn warn" onclick="deleteBlog('${b.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  if(listProjects){
    const projects = get('projects');
    listProjects.innerHTML = projects.map(p=>`
      <div class="card">
        <strong>${p.title}</strong> <span class="tag">${p.status}</span>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn" onclick="editProject('${p.id}')">Edit</button>
          <button class="btn warn" onclick="deleteProject('${p.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  if(tableEnroll){
    const rows = get('enrollments').map(e=>{
      const proj = get('projects').find(p=>p.id===e.projectId);
      return `<tr><td>${proj?.title||'—'}</td><td>${e.name}</td><td>${e.role}</td><td>${new Date(e.at).toLocaleString()}</td></tr>`;
    }).join('');
    tableEnroll.innerHTML = `<table style="width:100%;background:#fff;border-radius:12px;overflow:hidden">
      <thead style="background:#111;color:#fff"><tr><th>Project</th><th>Name</th><th>Role</th><th>Time</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:10px">No enrollments yet</td></tr>'}</tbody>
    </table>`;
  }
}

/* Expose handlers */
window.login = login;
window.openBlog = openBlog;
window.closeModal = closeModal;
window.saveBlogFromForm = saveBlogFromForm;
window.saveProjectFromForm = saveProjectFromForm;
window.deleteBlog = deleteBlog;
window.editBlog = editBlog;
window.renderBlogs = renderBlogs;
window.renderProjects = renderProjects;
window.renderAdminLists = renderAdminLists;
window.deleteProject = deleteProject;
window.editProject = editProject;
window.enroll = enroll;
