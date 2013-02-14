Meteor.subscribe("currentUser");
Meteor.subscribe("directory");
Meteor.subscribe("actives");

Meteor.Router.add({
  "/": function() {
    Session.set('path', this.canonicalPath);
    Session.set('post_id', null);
    Session.set('postit_id', null);
    Session.set('page', 1);
    Session.set('postit_tags', 'front_page');
    Session.set('page_tags', 'front_page');
    Session.set("tag-dir", "desc");
    WeFi.set_head( { tags: ['front_page'] } );
    Session.set("routed_template", "home");
    return Session.get("routed_template");
  }
});

Template.navbar.events({
  'click button.post': function(e, t) { return WeFi.root_post_popup(e, t) },
  'click button.hide-closed': function (event, template) {
    if($(event.target).hasClass('active')) {
      Session.set('hideClosed', false);
    } else {
      Session.set('hideClosed', true);
    }
  },
  'click .sort .btn': function (event, template) {
    Session.set('tag-sort', $(event.target).text());
  },
  'click .dir .btn': function (event, template) {
    Session.set('tag-dir', $(event.target).text());
  },
  'click .thread .btn': function (event, template) {
    Session.set('post-thread', $(event.target).text());
  }
});

Template.navbar.helpers({
  activePage: function (page) {
    return Session.equals("path", page) ? "active" : "";
  },
  isActive: function (key) {
    return Session.equals(key, true) ? "active" : "";
  },
  maybe: function (key, val) {
    return Session.equals(key, val) ? "active" : "";
  }
});

Template.tagsearch.events({
  'click button.tag-btn': function (event, template) {
    console.log('hi');
    return false;
  }
});

Template.tagsearch.rendered = function() {
  var template = this;
  Meteor.defer(function() {
    var b = Session.get("all_tags");
    if (b.length > 0) {
      $(template.find('input.tags')).typeahead( { source: b } );
    }
  });
};

Handlebars.registerHelper('canEdit', function (obj, prop) {
  var owner = Meteor.users.findOne(obj[prop]);
  return owner._id === Meteor.userId();
});

Handlebars.registerHelper('displayName', function (user) {
  return WeFi.displayName(user);
});

Handlebars.registerHelper('pager', function (user) {
  var func, link;
  switch (Session.get("routed_template")) {
  case "firehose":
    func = 'firehose_constraints';
    link = '/firehose'
    break;
  }
  
  if (func) {
    var pc = WeFi.query_func[func]();
    var count = Posts.find(pc[0], pc[1]).count();
    Pagination.currentPage(Session.get('page'));
    if (count && Pagination.totalPages(count, Pagination.perPage()) > 1)
      return Pagination.links(link, count);
  }
});

Handlebars.registerHelper('page_description', function (user) {
  switch (Session.get("routed_template")) {
  case "firehose":
    return 'All posts';
    break;
  }
});

Meteor.startup(function() {
  WeFi.md_converter = new Markdown.getSanitizingConverter();
  Session.set("tag-sort", "date");
  Session.set("post-thread", "thread");

  Meteor.autorun(function() {
    var tags = _.chain(Posts.find().fetch()).pluck('tags').flatten().uniq()
      .compact().sortBy(
	function(tag) {
	  return tag;
	}).value();
    if (tags)
      Session.set("all_tags", _.toArray(tags));
  });
});

Meteor.logout = _.wrap(Meteor.logout, function(logout) {
  var args = _.toArray(arguments).slice(1),
  origCallback = args[0];

  ActiveUsers.remove({ userId: Meteor.userId() });
  var newCallback = function(error) {
    origCallback.call(this, error);
  };
  
  logout(newCallback);
});
