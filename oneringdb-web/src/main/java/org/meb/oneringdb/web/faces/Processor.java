package org.meb.oneringdb.web.faces;

public interface Processor<S, T> {

	T process(S source);
}
