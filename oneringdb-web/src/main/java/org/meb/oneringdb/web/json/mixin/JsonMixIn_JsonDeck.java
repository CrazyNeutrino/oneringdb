package org.meb.oneringdb.web.json.mixin;

import org.codehaus.jackson.annotate.JsonIgnoreProperties;

@JsonIgnoreProperties(value = { "loadMembers", "loadLinks", "loadComments", "loadSnapshots" })
public class JsonMixIn_JsonDeck {

}
