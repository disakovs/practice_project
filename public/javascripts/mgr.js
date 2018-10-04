class App {
  constructor() {
    this.$createForm = $('#create_contact');
    this.$contactList = $('#all_contacts');
    this.$manageContacts = $('#manage_contacts');
    this.compileTemplates();
    this.currentContacts;
    this.renderContacts();
    this.bindEvents();
  };
  
  bindEvents() {
    $('input[value="Add Contact"]').on('click', this.handleClickAddContact.bind(this));
    $(document).on('click', 'input[value="Cancel"]', this.handleReturnToContacts.bind(this));
    $('#all_contacts').on('click', 'input[value="Delete"]', this.handleDeleteContact.bind(this));
    $('#all_contacts').on('click', 'input[value="Edit"]', this.handleShowEditForm.bind(this));
    $('#edit').on('submit', this.handleEditContact.bind(this));
    this.$createForm.on('submit', this.handleSubmitNewContact.bind(this));
    $('#search').on('keyup', this.handleSearchInput.bind(this));
    $(document).on('click', 'a.tag', this.handleTagFilter.bind(this));
  }
  
  filterTags(string) {
    return this.currentContacts.filter(contact => {
      return contact.tags.includes(string);
    });
  }
  
  handleTagFilter(e) {
    e.preventDefault();
    
    let tag = $(e.target).html();
    let filteredContacts = this.filterTags(tag);
    let html = this.contactsTemplate({contacts: filteredContacts});
    
    this.$contactList.empty();
    this.$contactList.append(html);
  }
  
  compileTemplates() {
    this.contactsTemplate = Handlebars.compile($('#contact_outline').html());
    this.editContactTemplate = Handlebars.compile($('#edit_contact').html());
  }
  
  filterNames(string) {
    let regex = new RegExp(string, 'i');
    
    return this.currentContacts.filter(contact => {
      return contact.full_name.match(regex);
    });
  }
  
  handleSearchInput(e) {
    let input = $(e.target).val();
    let filteredContacts = this.filterNames(input);

    this.$contactList.empty();
    
    if (filteredContacts.length > 0) {
      $('div.not_found').hide();
      let html = this.contactsTemplate({contacts: filteredContacts});
      this.$contactList.append(html);
    } else {
      $('div.not_found strong').html(input);
      $('div.not_found').show();
    }
  }
  
  handleEditContact(e) {
    e.preventDefault();
    let $f = $(e.target)
    let self = this;
    
    $.ajax({
      url: $f.attr('action') + $f.attr('data-id'),
      type: $f.attr('method'),
      dataType: 'json',
      data: $f.serialize(),
      success: function(data) {
        self.renderContacts();
      },
      complete: function(data) {
        self.handleReturnToContacts('afterEdit');
      }
    });
  }
  
  handleDeleteContact(e) {
    let $thisContact = $(e.target).closest('div.contact');
    let id = $thisContact.attr('data-id');
    let confirmDelete = confirm('Do you really want to delete this contact?');
    
    if (confirmDelete) {
      $.ajax({
        url: '/api/contacts/' + id,
        type: 'delete',
        success: function(data) {
          $thisContact.remove();
        }
      });
    }
  }
  
  handleShowEditForm(e) {
    let $thisContactDiv = $(e.target).closest('div.contact');
    let id = $thisContactDiv.attr('data-id');
    let self = this;
    
    $.ajax({
      url: '/api/contacts/' + id,
      type: 'get',
      dataType: 'json',
      success: function(jsonContact) {
        let html = self.editContactTemplate(jsonContact);
        $(html).appendTo($('#edit'));
        $('#manage_contacts').slideUp(800);
      }
    });
  }
  
  objectifyTags(contactList) {
    contactList.forEach(contact => {
      contact.tags = contact.tags.split(',').map(word => word.trim());
    });
  }
  
  renderContacts() {
    this.$contactList.empty();
    let self = this;
    
    $.ajax({
      url: '/api/contacts',
      type: 'get',
      dataType: 'json',
      success: function(json) {
        self.objectifyTags(json);
        let html = self.contactsTemplate({contacts: json})
        self.currentContacts = json;
        self.$contactList.append(html);
      }
    });
  }
  
  handleClickAddContact(e) {
    e.preventDefault();
    this.$createForm.insertAfter(this.$manageContacts);
    this.$manageContacts.slideUp(800);
    this.$createForm.slideDown(800);
  }
  
  handleReturnToContacts(isEdit) {
    if (!isEdit) { 
      this.$manageContacts.insertAfter(this.$createForm);
    };
    $('form').slideUp(800);
    this.$manageContacts.slideDown(800);
  }
  
  handleSubmitNewContact(e) {
    e.preventDefault();
    let self = this;
    
    $.ajax({
      url: this.$createForm.attr('action'),
      type: this.$createForm.attr('method'),
      dataType: 'json',
      data: this.$createForm.serialize(),
      success: function(data) {
        self.renderContacts();
      },
      complete: function(data) {
        $(e.target).get(0).reset();
        self.handleReturnToContacts();
      }
    });
  } 
}

const runApp = new App();
