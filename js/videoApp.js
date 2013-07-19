// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Video Model
  // ----------

  // Our basic **Video** model has `title`, `order`, and `done` attributes.
  var Video = Backbone.Model.extend({

    // Default attributes for the Video item.
    defaults: function() {
      return {
        title: "empty Video...",
        url: '',
        order: Videos.nextOrder()
        
      };
    },

    // Ensure that each Video created has `title`.
    initialize: function() {
      if (!this.get("title")) {
        this.set({"title": this.defaults().title});
      }
    },

    // // Toggle the `done` state of this Video item.
    // toggle: function() {
    //   this.save({done: !this.get("done")});
    // }

  });

  // Video Collection
  // ---------------

  // The collection of Videos is backed by *localStorage* instead of a remote
  // server.
  var VideoPlayList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Video,

    // Save all of the Video items under the `"videos-backbone"` namespace.
    localStorage: new Backbone.LocalStorage("videos-backbone"),

    // Filter down the list of all Video items that are finished.
    done: function() {
      return this.filter(function(Video){ return Video.get('done'); });
    },

    // Filter down the list to only Video items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Videos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Videos are sorted by their original insertion order.
    comparator: function(Video) {
      return Video.get('order');
    }

  });

  // Create our global collection of **Videos**.
  var Videos = new VideoPlayList;

  
  
  var VideoPlayerView = Backbone.View.extend({

    el: $('#video-container'),

     Videotemplate: _.template($('#videoplayer-template').html()),

    initialize: function(){
      this.render();
    },

    render: function(){
      this.$el.html(this.Videotemplate());
    },

      remove: function() {
        this.undelegateEvents();
        this.$el.empty();
        this.stopListening();
        return this;
    },

      add: function() {
        var base_url = 'http://www.youtube.com/embed?listType=search&list=' ;
 var search_field = txt;
 var target_url = base_url + search_field;
 var ifr = document.getElementById('youriframe') ;
 ifr.src = target_url ;
 return false ;

        return this;
    }

  });

  var videoPlayerView = new VideoPlayerView();

  // Video Item View
  // --------------

  // The DOM element for a Video item...
  var VideoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#video-item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"   : "toggleDone",
      "click .view"     : "showVideo",
      "click a.destroy" : "clear",
      "keypress .showVideo"  : "updateOnEnter",
      "blur .showVideo"      : "close"
    },

    // The VideoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Video** and a **VideoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.listenTo(this.model, 'destroy', this.remove);
    },

    // Re-render the titles of the Video item.
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.showVideo');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },


    // Switch this view into `"showVideo"` mode, displaying the input field.
    showVideo: function(e) {

      txt = this.$('label').text();;
      videoPlayerView.remove();
      videoPlayerView.render();
      videoPlayerView.add();
      return this;
    },

    // Close the `"showVideoing"` mode, saving changes to the Video.
    close: function() {
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        this.model.save({title: value});
        this.model.save({url: value});
        this.$el.removeClass("showVideoing");
      }
    },

    // If you hit `enter`, we're through showVideoing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }


  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#playlist-container"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #yourtextfield":  "createOnEnter",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },

    // At initialization we bind to the relevant events on the `Videos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting Videos that might be saved in *localStorage*.
    initialize: function() {

      this.input = this.$("#yourtextfield");
      this.allCheckbox = this.$("#main")[0];

      this.listenTo(Videos, 'add', this.addOne);
      this.listenTo(Videos, 'reset', this.addAll);
      this.listenTo(Videos, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');

      Videos.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = Videos.done().length;
      var remaining = Videos.remaining().length;

      if (Videos.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining;
    },

    // Add a single Video item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(Video) {
      var view = new VideoView({model: Video});
      this.$("#video-playlist").append(view.render().el);
    },

    // Add all items in the **Videos** collection at once.
    addAll: function() {
      Videos.each(this.addOne, this);
    },

    // If you hit return in the main input field, create new **Video** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;
      Videos.create({title: this.input.val(), url: 'http://www.youtube.com/embed?listType=search&list=' + this.input.val()});
      if(e.keyCode == 13) form.submit(); 
      this.input.val('');

    },

    // Clear all done Video items, destroying their models.
    clearCompleted: function() {
      _.invoke(Videos.done(), 'destroy');
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Videos.each(function (Video) { Video.save({'done': done}); });
    }

  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

   console.log(Videos);

});

function go_get(){
 var base_url = 'http://www.youtube.com/embed?listType=search&list=' ;
 var search_field = document.getElementById('yourtextfield').value ;
 var target_url = base_url + search_field ;
 var ifr = document.getElementById('youriframe') ;
 ifr.src = target_url ;
 return false ;
}


